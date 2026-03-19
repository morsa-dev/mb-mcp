import assert from "node:assert/strict";
import test from "node:test";

import { createHttpApp, createMcpBodyErrorHandler } from "../src/http/createHttpApp.js";

type MockResponse = {
  headersSent: boolean;
  statusCode?: number;
  payload?: unknown;
  contentType?: string;
  status: (code: number) => MockResponse;
  type: (contentType: string) => MockResponse;
  json: (body: unknown) => MockResponse;
  send: (body: unknown) => MockResponse;
};

type RouteLayer = {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
    stack?: Array<{
      handle: (req: unknown, res: unknown, next?: (error?: unknown) => void) => void;
    }>;
  };
};

const createMockResponse = (): MockResponse => {
  const response: MockResponse = {
    headersSent: false,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    type(contentType: string) {
      response.contentType = contentType;
      return response;
    },
    json(body: unknown) {
      response.payload = body;
      return response;
    },
    send(body: unknown) {
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
      path: "/instructions",
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
    mcpPath: "/mcp",
  });

  const mcpRoutes = app.router.stack
    .filter((layer) => (layer as RouteLayer).route?.path === "/mcp")
    .map((layer) => ({ ...((layer as RouteLayer).route?.methods ?? {}) }));

  assert.deepEqual(mcpRoutes.slice(0, 3), [{ get: true }, { post: true }, { delete: true }]);
  assert.equal(mcpRoutes.length, 4);
});

test("createHttpApp exposes a static instructions page on the root route with the public MCP endpoint", () => {
  const app = createHttpApp({
    host: "127.0.0.1",
    port: 3000,
    mcpPath: "/mcp",
  });

  const instructionsLayer = app.router.stack.find((layer) => (layer as RouteLayer).route?.path === "/") as RouteLayer | undefined;

  assert.ok(instructionsLayer?.route?.stack?.[0], "expected root instructions route to be registered");

  const response = createMockResponse();

  instructionsLayer.route.stack[0].handle(
    {
      protocol: "http",
      get(headerName: string) {
        if (headerName === "x-forwarded-proto") {
          return "https";
        }
        if (headerName === "x-forwarded-host") {
          return "mb-mcp.morsa.io";
        }
        if (headerName === "host") {
          return "127.0.0.1:3000";
        }
        return undefined;
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, "html");
  assert.equal(typeof response.payload, "string");
  assert.match(response.payload as string, /Memory Bank MCP Instructions/);
  assert.match(response.payload as string, /Choose provider and setup mode/);
  assert.match(response.payload as string, /Create Memory Bank via mcp/);
  assert.match(response.payload as string, /https:\/\/mb-mcp\.morsa\.io\/mcp/);
  assert.match(response.payload as string, /MemoryBank-Agent-Provider/);
  assert.doesNotMatch(response.payload as string, /Use the create tool with/);
});

test("createHttpApp also serves the instructions page on /instructions", () => {
  const app = createHttpApp({
    host: "127.0.0.1",
    port: 3000,
    mcpPath: "/mcp",
  });

  const instructionsLayer = app.router.stack.find((layer) => (layer as RouteLayer).route?.path === "/instructions") as RouteLayer | undefined;

  assert.ok(instructionsLayer?.route?.stack?.[0], "expected /instructions route to be registered");
});

test("createHttpApp also registers a favicon route for the docs pages", () => {
  const app = createHttpApp({
    host: "127.0.0.1",
    port: 3000,
    mcpPath: "/mcp",
  });

  const faviconLayer = app.router.stack.find((layer) => (layer as RouteLayer).route?.path === "/favicon.ico") as RouteLayer | undefined;

  assert.ok(faviconLayer?.route?.stack?.[0], "expected /favicon.ico route to be registered");
});
