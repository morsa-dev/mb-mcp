import { CREATE_GENERAL } from "./prompts/general.js";
import { CREATE_STACK_SELECTION } from "./prompts/stackSelection.js";
import { CLAUDE_PROVIDER_PROMPT } from "./prompts/providers/claude.js";
import { CODEX_PROVIDER_PROMPT } from "./prompts/providers/codex.js";
import { CURSOR_PROVIDER_PROMPT } from "./prompts/providers/cursor.js";
import { CREATE_TYPESCRIPT_SHARED } from "./prompts/shared/typescript.js";
import { CREATE_ANGULAR } from "./prompts/stacks/angular.js";
import { CREATE_IOS } from "./prompts/stacks/ios.js";
import { CREATE_NEXTJS } from "./prompts/stacks/nextjs.js";
import { CREATE_NODEJS } from "./prompts/stacks/nodejs.js";
import { CREATE_OTHER } from "./prompts/stacks/other.js";
import { CREATE_REACT } from "./prompts/stacks/react.js";
import type { CreateToolInput, FlowAgentProvider, FlowStack, RenderedCreatePrompt } from "./types.js";

const STACK_PROMPTS: Record<FlowStack, string> = {
  ios: CREATE_IOS,
  angular: CREATE_ANGULAR,
  react: CREATE_REACT,
  nextjs: CREATE_NEXTJS,
  nodejs: CREATE_NODEJS,
  other: CREATE_OTHER,
};

const PROVIDER_PROMPTS: Record<FlowAgentProvider, string> = {
  cursor: CURSOR_PROVIDER_PROMPT,
  codex: CODEX_PROVIDER_PROMPT,
  claude: CLAUDE_PROVIDER_PROMPT,
};

const TYPESCRIPT_SHARED_STACKS = new Set<FlowStack>(["angular", "react", "nextjs", "nodejs"]);

const normalizeStack = (value: unknown): FlowStack | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "ios" || normalized === "swift" || normalized === "swiftui" || normalized === "uikit") {
    return "ios";
  }
  if (normalized === "angular" || normalized === "ng") {
    return "angular";
  }
  if (normalized === "react" || normalized === "reactjs") {
    return "react";
  }
  if (normalized === "nextjs" || normalized === "next") {
    return "nextjs";
  }
  if (normalized === "nodejs" || normalized === "node" || normalized === "express" || normalized === "nestjs") {
    return "nodejs";
  }
  if (normalized === "other" || normalized === "default" || normalized === "unsure") {
    return "other";
  }

  return "other";
};

const normalizeAgentProvider = (value: unknown): FlowAgentProvider => {
  if (typeof value !== "string") {
    return "cursor";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "codex") {
    return "codex";
  }
  if (normalized === "claude") {
    return "claude";
  }

  return "cursor";
};

const normalizeCreateInput = (input: unknown): CreateToolInput => {
  if (!input || typeof input !== "object") {
    return {};
  }

  const record = input as Record<string, unknown>;

  const stack = normalizeStack(record.stack);

  return {
    agentProvider: normalizeAgentProvider(record.agentProvider),
    ...(stack ? { stack } : {}),
  };
};

export const renderCreatePrompt = (input: unknown): RenderedCreatePrompt => {
  const normalized = normalizeCreateInput(input);
  const agentProvider = normalized.agentProvider ?? "cursor";

  if (!normalized.stack) {
    return {
      prompt: CREATE_STACK_SELECTION,
      agentProvider,
      requiresStackSelection: true,
    };
  }

  const promptParts = [
    CREATE_GENERAL,
    STACK_PROMPTS[normalized.stack],
    ...(TYPESCRIPT_SHARED_STACKS.has(normalized.stack) ? [CREATE_TYPESCRIPT_SHARED] : []),
    PROVIDER_PROMPTS[agentProvider],
  ];

  return {
    prompt: promptParts.join("\n\n"),
    agentProvider,
    stack: normalized.stack,
    requiresStackSelection: false,
  };
};
