import { z } from "zod";

import { buildDocsContextPayload } from "../../features/docsContext/buildDocsContextPayload.js";
import {
  DEFAULT_DETAIL_LEVEL,
  DEFAULT_STACK,
  DOCS_CONTEXT_DETAIL_LEVELS,
  DOCS_CONTEXT_SOURCE,
  DOCS_CONTEXT_SUPPORTED_STACKS,
  DOCS_CONTEXT_TOOL_NAME,
  MAX_QUERIES_PER_CALL,
  STRUCTURED_TOP_ITEMS_PER_QUERY_MAX,
} from "../../features/docsContext/types.js";
import type { ToolRegistrar } from "../registerTools.js";

const docsContextToolDescription =
  "Search official documentation context for a target stack and return compact snippets (title, url, excerpt, score). Use detailLevel=structured when you need richer extracted context for top results; details may include summary, declarations, code examples, and deprecation signals.";

export const registerDocsContextTool: ToolRegistrar = (server) => {
  server.registerTool(
    DOCS_CONTEXT_TOOL_NAME,
    {
      title: "Search Documentation Context",
      description: docsContextToolDescription,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
      inputSchema: {
        stack: z
          .enum(DOCS_CONTEXT_SUPPORTED_STACKS)
          .optional()
          .describe(`Target documentation stack. Default: ${DEFAULT_STACK}.`),
        version: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe(
            "Optional documentation or framework version hint. For Angular, pass a major or semver value such as 20 or 20.2.0 to target versioned docs.",
          ),
        detailLevel: z
          .enum(DOCS_CONTEXT_DETAIL_LEVELS)
          .optional()
          .describe(
            `Response depth. Canonical values: ${DOCS_CONTEXT_DETAIL_LEVELS.join(" | ")}. Default: ${DEFAULT_DETAIL_LEVEL}.`,
          ),
        structuredTopItemsPerQuery: z
          .number()
          .int()
          .min(1)
          .max(STRUCTURED_TOP_ITEMS_PER_QUERY_MAX)
          .optional()
          .describe(
            "How many top results per query to enrich with structured details when detailLevel=structured. Default: 2.",
          ),
        queries: z
          .array(z.string().trim().min(1))
          .min(1)
          .max(MAX_QUERIES_PER_CALL)
          .describe("Textual search queries for the selected stack documentation. Prefer specific API names."),
        maxItemsPerQuery: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Maximum number of result items to return for each query. Default: 3."),
        excerptMaxChars: z
          .number()
          .int()
          .min(80)
          .max(600)
          .optional()
          .describe("Maximum excerpt length in characters for each result item. Default: 260."),
      },
      outputSchema: {
        source: z.literal(DOCS_CONTEXT_SOURCE),
        stack: z.enum(DOCS_CONTEXT_SUPPORTED_STACKS),
        version: z.string().optional(),
        resolvedVersion: z.string().optional(),
        detailLevel: z.enum(DOCS_CONTEXT_DETAIL_LEVELS),
        queries: z.array(z.string()),
        notice: z.string(),
        results: z.array(
          z.object({
            query: z.string(),
            totalItems: z.number().int(),
            detailsCount: z.number().int(),
            detailsCoverage: z.string(),
            items: z.array(
              z.object({
                title: z.string(),
                url: z.string().url(),
                source: z.literal(DOCS_CONTEXT_SOURCE),
                excerpt: z.string(),
                score: z.number(),
                details: z
                  .object({
                    summary: z.string().optional(),
                    declaration: z.string().optional(),
                    codeExample: z.string().optional(),
                    deprecation: z.string().optional(),
                  })
                  .optional(),
              }),
            ),
          }),
        ),
      },
    },
    async (args) => {
      const payload = await buildDocsContextPayload(args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
        structuredContent: payload,
      };
    },
  );
};
