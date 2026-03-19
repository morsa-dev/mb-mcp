const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;
const DEFAULT_MCP_PATH = "/mcp";

export type AppConfig = {
  host: string;
  port: number;
  mcpPath: string;
  allowedHosts?: string[];
};

const normalizePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }

  return parsed;
};

const normalizePath = (value: string | undefined): string => {
  if (!value) {
    return DEFAULT_MCP_PATH;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_MCP_PATH;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const normalizeAllowedHosts = (value: string | undefined): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  const allowedHosts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return allowedHosts.length > 0 ? allowedHosts : undefined;
};

export const readConfig = (): AppConfig => {
  const allowedHosts = normalizeAllowedHosts(process.env.ALLOWED_HOSTS);

  return {
    host: process.env.HOST?.trim() || DEFAULT_HOST,
    port: normalizePort(process.env.PORT),
    mcpPath: normalizePath(process.env.MCP_PATH),
    ...(allowedHosts ? { allowedHosts } : {}),
  };
};
