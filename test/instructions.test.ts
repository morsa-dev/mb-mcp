import assert from "node:assert/strict";
import test from "node:test";

import { renderInstructionsPage } from "../src/instructions/renderInstructionsPage.js";

test("renderInstructionsPage restores the tested provider and setup flow contract", () => {
  const html = renderInstructionsPage({
    mcpUrl: "https://mb-mcp.morsa.io/mcp",
    instructionsUrl: "https://mb-mcp.morsa.io/instructions",
    websiteUrl: "https://www.morsa.io/",
  });

  assert.match(html, /Connect Memory Bank MCP/i);
  assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="any" \/>/);
  assert.match(html, /Choose provider and setup mode/);
  assert.match(html, /Cursor/);
  assert.match(html, /Codex/);
  assert.match(html, /Claude/);
  assert.match(html, />Link</);
  assert.match(html, />Cursor app</);
  assert.match(html, />CLI</);
  assert.match(html, />Config file</);
  assert.match(html, /Create Memory Bank via mcp/);
  assert.match(html, /Optional docs_context example/);
  assert.match(html, /Use docs_context to fetch official iOS documentation for NavigationStack\./);
  assert.match(html, /cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=memory-bank&amp;config=/);
  assert.match(html, /cursor --add-mcp/);
  assert.match(
    html,
    /claude mcp add --scope user --transport http memory-bank &quot;https:\/\/mb-mcp\.morsa\.io\/mcp&quot; --header &quot;MemoryBank-Agent-Provider: claude&quot;/,
  );
  assert.match(html, /\[mcp_servers\.memory-bank\]/);
  assert.match(html, /\[mcp_servers\.memory-bank\.http_headers\]/);
  assert.match(html, /&quot;MemoryBank-Agent-Provider&quot;: &quot;cursor&quot;/);
  assert.match(html, /&quot;MemoryBank-Agent-Provider&quot;: &quot;claude&quot;/);
  assert.match(html, /&quot;MemoryBank-Agent-Provider&quot; = &quot;codex&quot;/);
  assert.doesNotMatch(html, /Use the create tool with/);
  assert.doesNotMatch(html, /&quot;agentProvider&quot;/);
  assert.doesNotMatch(html, /&quot;stack&quot;/);
});
