import assert from "node:assert/strict";
import test from "node:test";

import { createHttpApp, createMcpBodyErrorHandler } from "../src/http/createHttpApp.js";

type MockResponse = {
  headersSent: boolean;
  statusCode?: number;
  payload?: unknown;
  status: (code: number) => MockResponse;
  json: (body: unknown) => MockResponse;
};

type RouteLayer = {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
  };
};

const createMockResponse = (): MockResponse => {
  const response: MockResponse = {
    headersSent: false,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.payload = body;
      return response;
    },
  };

  return response;
};

test("createMcpBodyErrorHandler returns JSON-RPC parse errors for malformed MCP bodies", () => {
  const handler = createMcpBodyErrorHandler("/mcp");
  const response = createMockResponse();
  let forwardedError: unknown;

  handler(
    Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    }),
    {
      method: "POST",
      path: "/mcp",
    } as never,
    response as never,
    (error?: unknown) => {
      forwardedError = error;
    },
  );

  assert.equal(forwardedError, undefined);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.payload, {
    jsonrpc: "2.0",
    error: {
      code: -32700,
      message: "Parse error",
    },
    id: null,
  });
});

test("createMcpBodyErrorHandler forwards non-MCP errors", () => {
  const handler = createMcpBodyErrorHandler("/mcp");
  const response = createMockResponse();
  const error = new Error("boom");
  let forwardedError: unknown;

  handler(
    error,
    {
      method: "GET",
      path: "/healthz",
    } as never,
    response as never,
    (nextError?: unknown) => {
      forwardedError = nextError;
    },
  );

  assert.equal(forwardedError, error);
  assert.equal(response.statusCode, undefined);
  assert.equal(response.payload, undefined);
});

test("createHttpApp registers GET, POST, and DELETE on the MCP path before the catch-all handler", () => {
  const app = createHttpApp({
    host: "127.0.0.1",
    port: 0,
    mcpPath: "/",
  });

  const mcpRoutes = app.router.stack
    .filter((layer) => (layer as RouteLayer).route?.path === "/")
    .map((layer) => ({ ...((layer as RouteLayer).route?.methods ?? {}) }));

  assert.deepEqual(mcpRoutes.slice(0, 3), [{ get: true }, { post: true }, { delete: true }]);
  assert.equal(mcpRoutes.length, 4);
});
