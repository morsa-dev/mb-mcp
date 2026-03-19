import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import {
  StreamableHTTPServerTransport,
  type StreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

import type { AppConfig } from "../config.js";
import { renderInstructionsPage } from "../instructions/renderInstructionsPage.js";
import { createMcpServer } from "../mcp/createMcpServer.js";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const FAVICON_PATH = resolve(MODULE_DIR, "..", "..", "favicon.ico");

const buildJsonRpcError = (code: number, message: string) => ({
  jsonrpc: "2.0" as const,
  error: {
    code,
    message,
  },
  id: null,
});

type BodyParserError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

const buildBodyParserErrorResponse = (error: BodyParserError): { status: number; body: ReturnType<typeof buildJsonRpcError> } => {
  if (error.type === "entity.parse.failed") {
    return {
      status: 400,
      body: buildJsonRpcError(-32700, "Parse error"),
    };
  }

  if (error.type === "entity.too.large") {
    return {
      status: 413,
      body: buildJsonRpcError(-32600, "Invalid request: request body too large"),
    };
  }

  return {
    status: error.statusCode ?? error.status ?? 400,
    body: buildJsonRpcError(-32600, "Invalid request body"),
  };
};

export const createMcpBodyErrorHandler = (mcpPath: string): express.ErrorRequestHandler => {
  return (error, req, res, next) => {
    if (res.headersSent || req.method !== "POST" || req.path !== mcpPath) {
      next(error);
      return;
    }

    const response = buildBodyParserErrorResponse(error as BodyParserError);
    res.status(response.status).json(response.body);
  };
};

const closeQuietly = async (closeables: Array<{ close: () => void | Promise<void> }>): Promise<void> => {
  await Promise.allSettled(closeables.map((closeable) => Promise.resolve(closeable.close())));
};

const createStatelessTransport = (): StreamableHTTPServerTransport => {
  const transportOptions: StreamableHTTPServerTransportOptions = {
    enableJsonResponse: true,
  };

  return new StreamableHTTPServerTransport(transportOptions);
};

const connectServer = async (
  server: ReturnType<typeof createMcpServer>,
  transport: StreamableHTTPServerTransport,
): Promise<void> => {
  // SDK v1 transport typings are not fully compatible with exactOptionalPropertyTypes.
  await server.connect(transport as unknown as Transport);
};

const trimTrailingSlash = (value: string): string => (value.endsWith("/") ? value.slice(0, -1) : value);

const resolveRequestOrigin = (req: express.Request, config: AppConfig): string => {
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || req.protocol || "http";
  const host = forwardedHost || req.get("host") || `${config.host}:${config.port}`;

  return `${protocol}://${host}`;
};

const buildPublicUrl = (origin: string, path: string): string => {
  if (path === "/") {
    return trimTrailingSlash(origin);
  }

  return new URL(path, `${trimTrailingSlash(origin)}/`).toString();
};

const buildInstructionsHtml = (req: express.Request, config: AppConfig): string => {
  const origin = resolveRequestOrigin(req, config);

  return renderInstructionsPage({
    mcpUrl: buildPublicUrl(origin, config.mcpPath),
    instructionsUrl: buildPublicUrl(origin, "/instructions"),
    websiteUrl: "https://www.morsa.io/",
  });
};

export const createHttpApp = (config: AppConfig): express.Express => {
  const app = createMcpExpressApp({
    host: config.host,
    ...(config.allowedHosts ? { allowedHosts: config.allowedHosts } : {}),
  });

  app.disable("x-powered-by");

  const sendInstructionsPage: express.RequestHandler = (req, res) => {
    res.status(200).type("html").send(buildInstructionsHtml(req, config));
  };

  app.get("/favicon.ico", (_req, res) => {
    res.sendFile(FAVICON_PATH);
  });

  if (config.mcpPath !== "/") {
    app.get("/", sendInstructionsPage);
  }

  app.get("/instructions", sendInstructionsPage);

  const handleMcpRequest: express.RequestHandler = async (req, res) => {
    const server = createMcpServer();
    const transport = createStatelessTransport();

    let closed = false;
    const finalize = async (): Promise<void> => {
      if (closed) {
        return;
      }
      closed = true;
      await closeQuietly([transport, server]);
    };

    res.on("close", () => {
      void finalize();
    });

    try {
      await connectServer(server, transport);
      await transport.handleRequest(req, res, req.body);
      await finalize();
    } catch (error) {
      await finalize();
      console.error("Failed to handle MCP request", error);

      if (!res.headersSent) {
        res.status(500).json(buildJsonRpcError(-32603, "Internal server error"));
      }
    }
  };

  app.get(config.mcpPath, handleMcpRequest);
  app.post(config.mcpPath, handleMcpRequest);
  app.delete(config.mcpPath, handleMcpRequest);

  app.all(config.mcpPath, (_req, res) => {
    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).json(buildJsonRpcError(-32000, "Method not allowed"));
  });

  app.use(createMcpBodyErrorHandler(config.mcpPath));

  return app;
};
