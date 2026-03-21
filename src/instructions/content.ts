import type { ProviderGuide, ProviderId } from "./types.js";

const SERVER_NAME = "memory-bank";
const CURSOR_MCP_DOCS_URL = "https://docs.cursor.com/fr/advanced/model-context-protocol";
const CLAUDE_MCP_DOCS_URL = "https://docs.anthropic.com/fr/docs/claude-code/mcp";
const CODEX_MCP_DOCS_URL = "https://platform.openai.com/docs/docs-mcp";

export const RUN_COMMAND = "Create Memory Bank via mcp";
export const DOCS_CONTEXT_EXAMPLE =
  'Use docs_context to fetch official Angular documentation for signal with stack="angular" and version="20".';
export const PROVIDER_NOTES: Partial<Record<ProviderId, string>> = {};

const toJsonSnippet = (value: unknown): string => JSON.stringify(value, null, 2);

const toTomlSnippet = (sections: Array<{ header: string; lines: string[] }>): string =>
  sections
    .map((section) => [`[${section.header}]`, ...section.lines].join("\n"))
    .join("\n\n");

const toBase64Utf8 = (value: string): string => Buffer.from(value, "utf8").toString("base64");

const buildProviderTransportConfig = (provider: ProviderId, mcpUrl: string): { url: string; headers: Record<string, string> } => ({
  url: mcpUrl,
  headers: {
    "MemoryBank-Agent-Provider": provider,
  },
});

const buildCursorInstallLink = (mcpUrl: string): string => {
  const config = buildProviderTransportConfig("cursor", mcpUrl);
  const payload = JSON.stringify(config);
  const encodedName = encodeURIComponent(SERVER_NAME);
  const encodedConfig = toBase64Utf8(payload);

  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodedName}&config=${encodedConfig}`;
};

const buildProviderConfigSnippet = (provider: ProviderId, mcpUrl: string): string => {
  const transport = buildProviderTransportConfig(provider, mcpUrl);

  if (provider === "codex") {
    const providerHeader = transport.headers["MemoryBank-Agent-Provider"];

    return toTomlSnippet([
      {
        header: `mcp_servers.${SERVER_NAME}`,
        lines: [`url = "${transport.url}"`],
      },
      {
        header: `mcp_servers.${SERVER_NAME}.http_headers`,
        lines: [`"MemoryBank-Agent-Provider" = "${providerHeader}"`],
      },
    ]);
  }

  if (provider === "claude") {
    return toJsonSnippet({
      mcpServers: {
        [SERVER_NAME]: {
          type: "http",
          url: transport.url,
          headers: transport.headers,
        },
      },
    });
  }

  return toJsonSnippet({
    mcpServers: {
      [SERVER_NAME]: transport,
    },
  });
};

const buildProviderCliCommand = (provider: ProviderId, mcpUrl: string): string => {
  const transport = buildProviderTransportConfig(provider, mcpUrl);

  if (provider === "cursor") {
    const payload = JSON.stringify({
      name: SERVER_NAME,
      url: transport.url,
      headers: transport.headers,
    });

    return `cursor --add-mcp '${payload}'`;
  }

  return `claude mcp add --scope user --transport http ${SERVER_NAME} "${transport.url}" --header "MemoryBank-Agent-Provider: claude"`;
};

const buildProviderCliRemoveCommand = (): string => `claude mcp remove --scope user ${SERVER_NAME}`;

const getProviderConfigPath = (provider: ProviderId): string => {
  if (provider === "codex") return "~/.codex/config.toml";
  if (provider === "claude") return "~/.claude.json";
  return "~/.cursor/mcp.json or .cursor/mcp.json";
};

const getProviderConfigHint = (provider: ProviderId): string => {
  if (provider === "cursor") {
    return 'Add the "memory-bank" entry to the file you use. Keep any unrelated MCP servers already in that file.';
  }

  if (provider === "codex") {
    return 'Add the "memory-bank" sections to ~/.codex/config.toml. If the file already exists, append or merge them instead of replacing unrelated entries.';
  }

  if (provider === "claude") {
    return 'Add the "memory-bank" entry under root mcpServers for global setup, or under projects. <ABSOLUTE_PROJECT_PATH>.mcpServers for one project.';
  }

  return "";
};

export const buildProviderGuides = (mcpUrl: string): ProviderGuide[] => {
  const cursorConfig = buildProviderConfigSnippet("cursor", mcpUrl);
  const cursorCli = buildProviderCliCommand("cursor", mcpUrl);
  const cursorInstallLink = buildCursorInstallLink(mcpUrl);
  const codexConfig = buildProviderConfigSnippet("codex", mcpUrl);
  const claudeConfig = buildProviderConfigSnippet("claude", mcpUrl);
  const claudeCli = buildProviderCliCommand("claude", mcpUrl);
  const claudeRemove = buildProviderCliRemoveCommand();

  return [
    {
      id: "cursor",
      label: "Cursor",
      defaultMode: "link",
      modes: [
        {
          id: "link",
          label: "Link",
          title: "",
          note: "URL and headers are pre-filled. If it does not open Cursor, use CLI setup instead.",
          actionLabel: "Open link",
          actionHref: cursorInstallLink,
          hint: "",
          hideSnippet: true,
        },
        {
          id: "config",
          label: "Cursor app",
          title: "",
          note: "",
          snippet: cursorConfig,
          path: getProviderConfigPath("cursor"),
          hint: getProviderConfigHint("cursor"),
          docsHref: CURSOR_MCP_DOCS_URL,
          docsLabel: "Cursor MCP docs",
        },
        {
          id: "cli",
          label: "CLI",
          title: "Install via CLI",
          note: "",
          snippet: cursorCli,
        },
      ],
      reconnect: {
        link: {
          description: "If MCP is missing after link install, reinstall and reload.",
          steps: [
            "Open the install link again and confirm install or update for memory-bank.",
            "Restart Cursor or reopen the agent session.",
            `Run "${RUN_COMMAND}" in the agent to verify MCP is connected.`,
          ],
          actionLabel: "Reopen link",
          actionHref: cursorInstallLink,
        },
        config: {
          description: "If MCP is not detected, fix config scope and reload the client.",
          steps: [
            'Open ~/.cursor/mcp.json or .cursor/mcp.json and keep one valid "memory-bank" entry in the scope you need.',
            "Save config and fully restart Cursor or the agent.",
            `Run "${RUN_COMMAND}" in the agent to verify MCP is connected.`,
          ],
        },
        cli: {
          description: "If MCP is missing, reinstall it. If that still fails, remove the old entry manually.",
          steps: [
            "Run the reinstall command.",
            "If the issue persists, remove mcp.servers.memory-bank from Cursor settings.",
            `Restart or reopen the agent session, then run "${RUN_COMMAND}" to verify MCP is connected.`,
          ],
          snippetTitle: "Reinstall command",
          snippet: cursorCli,
        },
      },
    },
    {
      id: "codex",
      label: "Codex",
      defaultMode: "config",
      modes: [
        {
          id: "config",
          label: "Config file",
          title: "",
          note: "",
          snippet: codexConfig,
          path: getProviderConfigPath("codex"),
          hint: getProviderConfigHint("codex"),
          docsHref: CODEX_MCP_DOCS_URL,
          docsLabel: "OpenAI MCP docs",
        },
      ],
      reconnect: {
        config: {
          description: "If MCP is not detected, fix config scope and reload the client.",
          steps: [
            'Open ~/.codex/config.toml and keep one valid "memory-bank" entry with the required HTTP headers.',
            "Save config and fully restart Codex or the agent session.",
            `Run "${RUN_COMMAND}" in the agent to verify MCP is connected.`,
          ],
        },
      },
    },
    {
      id: "claude",
      label: "Claude",
      defaultMode: "cli",
      modes: [
        {
          id: "cli",
          label: "CLI",
          title: "Install via CLI",
          note: "",
          snippet: claudeCli,
        },
        {
          id: "config",
          label: "Config file",
          title: "",
          note: "",
          snippet: claudeConfig,
          path: getProviderConfigPath("claude"),
          hint: getProviderConfigHint("claude"),
          docsHref: CLAUDE_MCP_DOCS_URL,
          docsLabel: "Claude Code MCP docs",
        },
      ],
      reconnect: {
        cli: {
          description: "If MCP is missing, remove the old registration and add it again.",
          steps: [
            "Run the remove command.",
            "Run the install command again.",
            "Restart or reopen your agent session.",
            `Run "${RUN_COMMAND}" in the agent to verify MCP is connected.`,
          ],
          removeSnippetTitle: "Remove command",
          removeSnippet: claudeRemove,
          snippetTitle: "Reinstall command",
          snippet: claudeCli,
        },
        config: {
          description: "If MCP is not detected, fix config scope and reload the client.",
          steps: [
            'Open ~/.claude.json and keep one valid "memory-bank" entry in the scope you need.',
            "Save config and fully restart Claude or the agent session.",
            `Run "${RUN_COMMAND}" in the agent to verify MCP is connected.`,
          ],
        },
      },
    },
  ];
};
