import assert from "node:assert/strict";
import test from "node:test";

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
