import { z } from "zod";

import { renderCreatePrompt } from "../../features/create/renderCreatePrompt.js";
import { CREATE_TOOL_NAME, FLOW_AGENT_PROVIDERS, FLOW_STACKS } from "../../features/create/types.js";
import { DEFAULT_AGENT_PROVIDER } from "../../mcp/agentProvider.js";
import type { ToolRegistrar } from "../registerTools.js";

const createToolDescription =
  "MemoryBank one-shot initialize/create flow. Returns executable instructions for building a project-specific memory bank from real codebase patterns.";
const createToolArgsSchema = z
  .object({
    stack: z.string().optional(),
  })
  .strict();

export const registerCreateTool: ToolRegistrar = (server, options = {}) => {
  const runtimeAgentProvider = options.agentProvider ?? DEFAULT_AGENT_PROVIDER;

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
      },
      outputSchema: {
        prompt: z.string(),
        agentProvider: z.enum(FLOW_AGENT_PROVIDERS),
        stack: z.enum(FLOW_STACKS).optional(),
        requiresStackSelection: z.boolean(),
      },
    },
    async (args) => {
      const parsedArgs = createToolArgsSchema.safeParse(args);
      if (!parsedArgs.success) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid arguments for tool create: ${z.prettifyError(parsedArgs.error)}`,
            },
          ],
        };
      }

      const { stack } = parsedArgs.data;
      const rendered = renderCreatePrompt({ stack, agentProvider: runtimeAgentProvider });

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
