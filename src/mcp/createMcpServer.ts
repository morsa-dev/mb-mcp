import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { MCP_SERVER_INSTRUCTIONS, PROJECT_NAME, PROJECT_VERSION } from "../serverMetadata.js";
import { registerTools } from "../tools/registerTools.js";

export const createMcpServer = (): McpServer => {
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

  registerTools(server);

  return server;
};
