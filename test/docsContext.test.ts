import assert from "node:assert/strict";
import test from "node:test";

import { searchAngularDocs } from "../src/adapters/angularDocs/search.js";
import { searchAppleDeveloperDocs } from "../src/adapters/appleDocs/search.js";
import { buildDocsContextPayload } from "../src/features/docsContext/buildDocsContextPayload.js";

test("searchAppleDeveloperDocs keeps tutorial results for documentation lookups", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    return {
      ok: true,
      text: async () =>
        '<article><a data-result-type="documentation-tutorial" href="/tutorials/swiftui" data-result-order="1">SwiftUI Essentials</a><p class="result-description">Learn SwiftUI basics.</p></article>',
    } as Response;
  });

  const results = await searchAppleDeveloperDocs("swiftui", {
    type: "documentation",
    maxResults: 3,
    excerptMaxChars: 120,
    timeoutMs: 1_000,
    retries: 0,
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.url, "https://developer.apple.com/tutorials/swiftui");
});

test("buildDocsContextPayload marks zero-result queries as partial in notice", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    return {
      ok: true,
      text: async () => "<html><body>No results</body></html>",
    } as Response;
  });

  const payload = await buildDocsContextPayload({
    queries: ["URLSessionWebSocketTask"],
  });

  assert.match(payload.notice, /Some queries returned no results or could not be fetched within the request budget\./);
  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0]?.items.length, 0);
});

test("buildDocsContextPayload uses the remaining sub-second budget for the current query", async (t) => {
  const dateNowValues = [0, 19_500, 20_000];
  const scheduledTimeouts: number[] = [];
  let fetchCalls = 0;

  t.mock.method(Date, "now", () => dateNowValues.shift() ?? 19_500);
  t.mock.method(
    globalThis,
    "setTimeout",
    ((callback: () => void, delay?: number) => {
      scheduledTimeouts.push(delay ?? 0);
      return {
        [Symbol.dispose]() {},
        ref() {
          return this;
        },
        unref() {
          return this;
        },
      } as never;
    }) as unknown as typeof setTimeout,
  );
  t.mock.method(globalThis, "clearTimeout", () => {});
  t.mock.method(globalThis, "fetch", async () => {
    fetchCalls += 1;
    return {
      ok: true,
      text: async () => "<html><body>No results</body></html>",
    } as Response;
  });

  const payload = await buildDocsContextPayload({
    queries: ["URLSession", "URLRequest"],
  });

  assert.equal(fetchCalls, 1);
  assert.equal(scheduledTimeouts[0], 500);
  assert.match(payload.notice, /Some queries returned no results or could not be fetched within the request budget\./);
  assert.equal(payload.results.length, 2);
  assert.equal(payload.results[0]?.items.length, 0);
  assert.equal(payload.results[1]?.items.length, 0);
});

test("searchAngularDocs targets versioned Angular documentation when version is provided", async (t) => {
  const requestedUrls: string[] = [];

  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requestedUrls.push(url);

    return {
      ok: true,
      text: async () => {
        if (url.endsWith("/api")) {
          return '<a href="/api/core/signal">signal</a>';
        }

        return '<a href="/guide/signals">Signals</a>';
      },
    } as Response;
  });

  const results = await searchAngularDocs("signal", {
    version: "20.2.1",
    maxResults: 5,
    timeoutMs: 1_000,
    retries: 0,
  });

  assert.equal(requestedUrls[0], "https://v20.angular.dev/api");
  assert.equal(requestedUrls[1], "https://v20.angular.dev/overview");
  assert.equal(results[0]?.url, "https://v20.angular.dev/api/core/signal");
});

test("searchAngularDocs normalizes noisy Angular guide anchor titles", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);

    return {
      ok: true,
      text: async () => {
        if (url.endsWith("/api")) {
          return "<html><body></body></html>";
        }

        return `
          <a href="/guide/signals">
            <div>Get fast state updates with fine-grained reactivity based on Signals</div>
            <p>Our fine-grained reactivity model helps build faster apps by default.</p>
            <span>Explore Angular Signals</span>
          </a>
        `;
      },
    } as Response;
  });

  const results = await searchAngularDocs("signals", {
    version: "20",
    maxResults: 3,
    timeoutMs: 1_000,
    retries: 0,
  });

  assert.equal(results[0]?.title, "Angular Signals");
  assert.equal(results[0]?.url, "https://v20.angular.dev/guide/signals");
});

test("buildDocsContextPayload returns Angular results with resolved version metadata", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);

    if (url.endsWith("/api")) {
      return {
        ok: true,
        text: async () => '<a href="/api/core/signal">signal</a>',
      } as Response;
    }

    if (url.endsWith("/overview")) {
      return {
        ok: true,
        text: async () => '<a href="/guide/signals">Signals</a>',
      } as Response;
    }

    return {
      ok: true,
      text: async () =>
        `
          <html>
            <body>
              <h1>signal</h1>
              <p>Creates a writable signal in Angular.</p>
              <pre><code>function signal(initialValue: T): WritableSignal&lt;T&gt;;</code></pre>
            </body>
          </html>
        `,
    } as Response;
  });

  const payload = await buildDocsContextPayload({
    stack: "angular",
    version: "20.2.1",
    detailLevel: "structured",
    queries: ["signal"],
  });

  assert.equal(payload.stack, "angular");
  assert.equal(payload.version, "20.2.1");
  assert.equal(payload.resolvedVersion, "20");
  assert.equal(payload.results[0]?.items[0]?.url, "https://v20.angular.dev/api/core/signal");
  assert.match(String(payload.results[0]?.items[0]?.details?.summary), /writable signal/i);
});

test("buildDocsContextPayload rejects invalid Angular docs version values", async () => {
  await assert.rejects(
    () =>
      buildDocsContextPayload({
        stack: "angular",
        version: "banana",
        queries: ["signal"],
      }),
    /Invalid Angular docs version "banana"/,
  );
});

test("buildDocsContextPayload surfaces unsupported Angular docs version as a configuration error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("getaddrinfo ENOTFOUND v17.angular.dev");
  });

  await assert.rejects(
    () =>
      buildDocsContextPayload({
        stack: "angular",
        version: "17.3.0",
        queries: ["provideRouter"],
      }),
    /Angular docs version "17" is not available/,
  );
});
