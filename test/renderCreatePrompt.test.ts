import assert from "node:assert/strict";
import test from "node:test";

import { renderCreatePrompt } from "../src/features/create/renderCreatePrompt.js";

test("renderCreatePrompt returns stack selection when stack is missing", () => {
  const rendered = renderCreatePrompt({});

  assert.equal(rendered.agentProvider, "cursor");
  assert.equal(rendered.requiresStackSelection, true);
  assert.equal(rendered.stack, undefined);
  assert.match(rendered.prompt, /Select stack and call this tool again with arguments\.stack\./);
});

test("renderCreatePrompt normalizes stack aliases and includes shared TypeScript guidance", () => {
  const rendered = renderCreatePrompt({ stack: "next", agentProvider: "codex" });

  assert.equal(rendered.agentProvider, "codex");
  assert.equal(rendered.requiresStackSelection, false);
  assert.equal(rendered.stack, "nextjs");
  assert.match(rendered.prompt, /# Next\.js Project Guidance/);
  assert.match(rendered.prompt, /# TypeScript Guidance/);
  assert.match(rendered.prompt, /# Codex Provider Instructions/);
});
