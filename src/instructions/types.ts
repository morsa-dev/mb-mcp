export type ProviderId = "cursor" | "codex" | "claude";
export type SetupModeId = "link" | "cli" | "config";

export type SetupMode = {
  id: SetupModeId;
  label: string;
  title: string;
  note: string;
  snippet?: string;
  path?: string;
  hint?: string;
  docsHref?: string;
  docsLabel?: string;
  actionLabel?: string;
  actionHref?: string;
  hideSnippet?: boolean;
};

export type ReconnectGuide = {
  description: string;
  steps: string[];
  actionLabel?: string;
  actionHref?: string;
  removeSnippetTitle?: string;
  removeSnippet?: string;
  snippetTitle?: string;
  snippet?: string;
};

export type ProviderGuide = {
  id: ProviderId;
  label: string;
  modes: SetupMode[];
  defaultMode: SetupModeId;
  reconnect: Partial<Record<SetupModeId, ReconnectGuide>>;
};

export type InstructionsPageModel = {
  mcpUrl: string;
  instructionsUrl: string;
  websiteUrl: string;
};
