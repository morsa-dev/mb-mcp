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
  assert.match(
    html,
    /Use docs_context to fetch official Angular documentation for signal with stack=&quot;angular&quot; and version=&quot;20&quot;\./,
  );
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
  assert.match(html, /Add the &quot;memory-bank&quot; entry to the file you use\./);
  assert.match(html, /Add the &quot;memory-bank&quot; sections to ~\/\.codex\/config\.toml\./);
  assert.match(html, /Add the &quot;memory-bank&quot; entry under root mcpServers for global setup/);
  assert.match(html, /Cursor MCP docs/);
  assert.match(html, /Claude Code MCP docs/);
  assert.match(html, /OpenAI MCP docs/);
  assert.doesNotMatch(html, /Use the create tool with/);
  assert.doesNotMatch(html, /&quot;agentProvider&quot;/);
  assert.doesNotMatch(html, /&quot;stack&quot;/);
});
