import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { createMcpServer } from "../src/mcp/createMcpServer.js";

const CreateStructuredContentSchema = z.object({
  stack: z.string().optional(),
  agentProvider: z.string().optional(),
  requiresStackSelection: z.boolean().optional(),
});

const getFirstTextContent = (result: z.infer<typeof CallToolResultSchema>): string | undefined => {
  const firstBlock = result.content[0];
  return firstBlock?.type === "text" ? firstBlock.text : undefined;
};

const createConnectedClient = async (options?: Parameters<typeof createMcpServer>[0]) => {
  const server = createMcpServer(options);
  const client = new Client({
    name: "mb-mcp-test-client",
    version: "0.0.0",
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const close = async () => {
    await Promise.allSettled([client.close(), server.close()]);
  };

  return { client, close };
};

test("server registers the public MCP tools with output schemas", async (t) => {
  const { client, close } = await createConnectedClient();
  t.after(close);

  const result = await client.listTools();
  const tools = new Map(result.tools.map((tool) => [tool.name, tool]));
  const createTool = tools.get("create");
  const createInputProperties =
    createTool?.inputSchema &&
    "properties" in createTool.inputSchema &&
    typeof createTool.inputSchema.properties === "object" &&
    createTool.inputSchema.properties !== null
      ? createTool.inputSchema.properties
      : undefined;

  assert.deepEqual(
    [...tools.keys()].sort(),
    ["create", "docs_context"],
  );
  assert.ok(createTool?.outputSchema);
  assert.ok(tools.get("docs_context")?.outputSchema);
  assert.deepEqual(Object.keys(createInputProperties ?? {}), ["stack"]);
  assert.equal(createInputProperties?.agentProvider, undefined);
});

test("create tool returns validated structured content", async (t) => {
  const { client, close } = await createConnectedClient({ agentProvider: "claude" });
  t.after(close);

  const result = CallToolResultSchema.parse(
    await client.callTool({
      name: "create",
      arguments: {
        stack: "react",
      },
    }),
  );
  const structuredContent = CreateStructuredContentSchema.parse(result.structuredContent);

  assert.equal(result.isError, undefined);
  assert.equal(structuredContent.stack, "react");
  assert.equal(structuredContent.agentProvider, "claude");
  assert.equal(structuredContent.requiresStackSelection, false);
  assert.match(String(getFirstTextContent(result)), /# React Project Guidance/);
  assert.match(String(getFirstTextContent(result)), /Claude Code-specific output format/);
});

test("create tool defaults to cursor when no runtime provider header is resolved", async (t) => {
  const { client, close } = await createConnectedClient();
  t.after(close);

  const result = CallToolResultSchema.parse(
    await client.callTool({
      name: "create",
      arguments: {
        stack: "react",
      },
    }),
  );

  const structuredContent = CreateStructuredContentSchema.parse(result.structuredContent);

  assert.equal(result.isError, undefined);
  assert.equal(structuredContent.agentProvider, "cursor");
  assert.match(String(getFirstTextContent(result)), /Cursor-specific output format/);
});

test("create tool uses runtime-resolved codex provider without public agentProvider argument", async (t) => {
  const { client, close } = await createConnectedClient({ agentProvider: "codex" });
  t.after(close);

  const result = CallToolResultSchema.parse(
    await client.callTool({
      name: "create",
      arguments: {
        stack: "react",
      },
    }),
  );

  const structuredContent = CreateStructuredContentSchema.parse(result.structuredContent);

  assert.equal(result.isError, undefined);
  assert.equal(structuredContent.agentProvider, "codex");
  assert.match(String(getFirstTextContent(result)), /Codex-specific output format/);
});

test("tool input validation still surfaces invalid docs_context arguments as tool errors", async (t) => {
  const { client, close } = await createConnectedClient();
  t.after(close);

  const invalidDocsContext = CallToolResultSchema.parse(
    await client.callTool({
      name: "docs_context",
      arguments: {
        stack: "android",
        queries: ["URLSession"],
      },
    }),
  );

  assert.equal(invalidDocsContext.isError, true);
  assert.match(String(getFirstTextContent(invalidDocsContext)), /Invalid arguments for tool docs_context/);
});

test("docs_context surfaces invalid Angular version as a tool error instead of silently falling back", async (t) => {
  const { client, close } = await createConnectedClient();
  t.after(close);

  const invalidDocsContext = CallToolResultSchema.parse(
    await client.callTool({
      name: "docs_context",
      arguments: {
        stack: "angular",
        version: "banana",
        queries: ["signal"],
      },
    }),
  );

  assert.equal(invalidDocsContext.isError, true);
  assert.match(String(getFirstTextContent(invalidDocsContext)), /Invalid Angular docs version "banana"/);
});
