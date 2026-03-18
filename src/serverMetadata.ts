import { createRequire } from "node:module";

type PackageJson = {
  name: string;
  version: string;
  description?: string;
};

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as PackageJson;

export const PROJECT_NAME = packageJson.name;
export const PROJECT_VERSION = packageJson.version;
export const PROJECT_DESCRIPTION = packageJson.description ?? "Standalone Memory Bank MCP server.";
export const PROJECT_USER_AGENT = `${PROJECT_NAME}/${PROJECT_VERSION}`;
export const MCP_SERVER_INSTRUCTIONS =
  "Memory Bank MCP server. Available tools: create for project-specific Memory Bank instructions, and docs_context for official documentation context lookup.";
