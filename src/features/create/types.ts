export const CREATE_TOOL_NAME = "create" as const;

export const FLOW_STACKS = ["ios", "angular", "react", "nextjs", "nodejs", "other"] as const;
export type FlowStack = (typeof FLOW_STACKS)[number];

export const FLOW_AGENT_PROVIDERS = ["cursor", "codex", "claude"] as const;
export type FlowAgentProvider = (typeof FLOW_AGENT_PROVIDERS)[number];

export type CreateToolInput = {
  agentProvider?: FlowAgentProvider;
  stack?: FlowStack;
};

export type RenderedCreatePrompt = {
  prompt: string;
  agentProvider: FlowAgentProvider;
  stack?: FlowStack;
  requiresStackSelection: boolean;
};
