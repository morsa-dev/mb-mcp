import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { FlowAgentProvider } from "../features/create/types.js";
import { MCP_SERVER_INSTRUCTIONS, PROJECT_NAME, PROJECT_VERSION } from "../serverMetadata.js";
import { registerTools } from "../tools/registerTools.js";

export type McpServerRuntimeOptions = {
  agentProvider?: FlowAgentProvider;
};

export const createMcpServer = (options: McpServerRuntimeOptions = {}): McpServer => {
  const server = new McpServer(
    {
      name: PROJECT_NAME,
      version: PROJECT_VERSION,
    },
    {
      capabilities: {
        logging: {},
      },
      instructions: MCP_SERVER_INSTRUCTIONS,
    },
  );

  registerTools(server, options);

  return server;
};
