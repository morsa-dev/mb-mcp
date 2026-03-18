import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerCreateTool } from "./create/registerCreateTool.js";
import { registerDocsContextTool } from "./docsContext/registerDocsContextTool.js";

export type ToolRegistrar = (server: McpServer) => void;

const toolRegistrars: ToolRegistrar[] = [registerCreateTool, registerDocsContextTool];

export const registerTools = (server: McpServer): void => {
  for (const registerTool of toolRegistrars) {
    registerTool(server);
  }
};
