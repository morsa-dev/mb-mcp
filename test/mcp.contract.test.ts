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

const createConnectedClient = async () => {
  const server = createMcpServer();
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

  assert.deepEqual(
    [...tools.keys()].sort(),
    ["create", "docs_context"],
  );
  assert.ok(tools.get("create")?.outputSchema);
  assert.ok(tools.get("docs_context")?.outputSchema);
});

test("create tool returns validated structured content", async (t) => {
  const { client, close } = await createConnectedClient();
  t.after(close);

  const result = CallToolResultSchema.parse(
    await client.callTool({
      name: "create",
      arguments: {
        stack: "react",
        agentProvider: "claude",
      },
    }),
  );
  const structuredContent = CreateStructuredContentSchema.parse(result.structuredContent);

  assert.equal(result.isError, undefined);
  assert.equal(structuredContent.stack, "react");
  assert.equal(structuredContent.agentProvider, "claude");
  assert.equal(structuredContent.requiresStackSelection, false);
  assert.match(String(getFirstTextContent(result)), /# React Project Guidance/);
});

test("tool input validation surfaces unsupported public arguments as tool errors", async (t) => {
  const { client, close } = await createConnectedClient();
  t.after(close);

  const invalidCreate = CallToolResultSchema.parse(
    await client.callTool({
      name: "create",
      arguments: {
        stack: "react",
        agentProvider: "invalid-provider",
      },
    }),
  );
  const invalidDocsContext = CallToolResultSchema.parse(
    await client.callTool({
      name: "docs_context",
      arguments: {
        stack: "android",
        queries: ["URLSession"],
      },
    }),
  );

  assert.equal(invalidCreate.isError, true);
  assert.match(String(getFirstTextContent(invalidCreate)), /Invalid arguments for tool create/);
  assert.equal(invalidDocsContext.isError, true);
  assert.match(String(getFirstTextContent(invalidDocsContext)), /Invalid arguments for tool docs_context/);
});
