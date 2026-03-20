import { FLOW_AGENT_PROVIDERS, type FlowAgentProvider } from "../features/create/types.js";

export const AGENT_PROVIDER_HEADER = "MemoryBank-Agent-Provider";
export const DEFAULT_AGENT_PROVIDER: FlowAgentProvider = "cursor";

export const resolveAgentProviderHeaderValue = (value: string | undefined): FlowAgentProvider => {
  if (!value) {
    return DEFAULT_AGENT_PROVIDER;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_AGENT_PROVIDER;
  }

  return FLOW_AGENT_PROVIDERS.find((provider) => provider === normalized) ?? DEFAULT_AGENT_PROVIDER;
};
