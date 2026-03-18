import { z } from "zod";

import { renderCreatePrompt } from "../../features/create/renderCreatePrompt.js";
import { CREATE_TOOL_NAME, FLOW_AGENT_PROVIDERS, FLOW_STACKS } from "../../features/create/types.js";
import type { ToolRegistrar } from "../registerTools.js";

const createToolDescription =
  "MemoryBank one-shot initialize/create flow. Returns executable instructions for building a project-specific memory bank from real codebase patterns.";

export const registerCreateTool: ToolRegistrar = (server) => {
  server.registerTool(
    CREATE_TOOL_NAME,
    {
      title: "Create Memory Bank",
      description: createToolDescription,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
      inputSchema: {
        stack: z
          .string()
          .optional()
          .describe(
            `Project stack selector. Canonical values: ${FLOW_STACKS.join(" | ")}. Accepted aliases are normalized automatically.`,
          ),
        agentProvider: z
          .enum(FLOW_AGENT_PROVIDERS)
          .optional()
          .describe(`Agent provider selector. Canonical values: ${FLOW_AGENT_PROVIDERS.join(" | ")}. Defaults to cursor.`),
      },
      outputSchema: {
        prompt: z.string(),
        agentProvider: z.enum(FLOW_AGENT_PROVIDERS),
        stack: z.enum(FLOW_STACKS).optional(),
        requiresStackSelection: z.boolean(),
      },
    },
    async ({ stack, agentProvider }) => {
      const rendered = renderCreatePrompt({ stack, agentProvider });

      return {
        content: [
          {
            type: "text",
            text: rendered.prompt,
          },
        ],
        structuredContent: rendered,
      };
    },
  );
};
