export const CREATE_GENERAL = `# General Instructions

You are the execution agent for MemoryBank creation in this project.
Read this prompt, execute it end-to-end, and create or update the memory bank files (rules + skills).
The goal is to reduce repeated ambiguity, avoid costly rework, and capture stable project-specific patterns for future coding tasks.

Use these inputs together:
- The selected stack guidance for this run.
- Real project code and configuration.
- Any additional context provided by the user in chat.

**Critical instructions:**
- Aim to complete the task without follow-up questions to the user.
- Ask concise clarifying questions when unresolved ambiguity can materially affect scope, structure, or output format.
- Execute this prompt end-to-end and return only the final completion report.
- Complete analysis before producing final output.
- Explore thoroughly before generating and avoid partial output.

## Example: Concise General Rules (Inspiration)

Use this section as style guidance for writing short, actionable general rules.
Generate project-specific rules, not generic copies.

- Start non-trivial tasks with a short 2-5 step plan so the user can confirm direction.
- If the user is exploring options, do not edit files until the user approves the chosen direction.
- If the task is straightforward and unambiguous, proceed directly and report concrete results.
- Ask clarifying questions only when ambiguity can change scope, structure, or output format.
- If an earlier unresolved topic may affect current work, give one short reminder before finalizing.
- Keep updates concise and decision-focused; avoid long theoretical explanations.
- Prefer project evidence over assumptions when proposing rules.
- When uncertain, mark assumptions explicitly and keep them minimal.

### Review-Focused Examples (Optional)

Use these only if code review behavior is relevant in this project:
- In review tasks, list findings first, ordered by severity.
- Include file-path evidence for each finding.
- Keep summaries short; prioritize risks, regressions, and missing tests.

## Existing Documentation (Also Accept as Input)

Read and incorporate patterns from:
- \`README.md\`
- \`CLAUDE.md\` / \`AGENTS.md\` / \`copilot-instructions.md\`
- Any \`docs/\` folder contents
- Relevant source code files that help infer and validate project-specific rules and recurring patterns
- Existing rule files from this repository (avoid duplication)

If the user shared additional context in chat, treat it as an important signal for decisions.

## Final Deduplication Pass

Before producing final output:

1. Build an internal list of candidate rules.
2. Remove duplicates and near-duplicates.
3. Keep one clear formulation per rule.

## Rule Quality Check

- Create a rule when at least one of these conditions is true:
  - The pattern appears repeatedly in the codebase.
  - The pattern is encoded in configuration or tooling.
  - The pattern is documented and reflected in the project structure.
  - The pattern is clearly part of the intended architecture.
- Each rule should describe a repeatable decision for this project.
- Each rule should be verifiable against project code or configuration.
- Prefer practical guidance over generic statements.

## Rule Applicability and Workflow Safety

For each candidate rule, decide explicitly:
- keep (clear evidence + practical value),
- skip (weak evidence or low value for this project),
- mark as \`[VERIFY: ...]\` (partial evidence and decision can affect workflow).

Safety constraints:
- Prefer rules that reinforce established project workflow over idealized rewrites.
- If a rule may disrupt team workflow and evidence is weak, skip it.
- If a decision is high-impact and evidence is partial, use \`[VERIFY: ...]\` or omit the rule.
- Treat stack-specific sections as candidate sources, not mandatory checklists.

## Reading/Index Skill Quality Gate

If you generate a reading/index-oriented skill (for example task-based-reading):
- do not output only a static file list or catalog
- include conditional routing logic (for example: "if task is X, read A -> B -> C")
- include branching paths for common task categories relevant to this project
- keep routing concise and directly actionable

## Permission Requests (Low Noise)

During this generation run:
- avoid unnecessary user interruptions; do not ask for permissions when they are not needed
- if permissions for reading or editing are required, request them in one concise grouped step whenever possible to minimize approval prompts

## Testing Rules Gate

Before generating rules about test coverage or mandatory tests:
- Assess how developed testing is in this project (test files, framework setup, CI usage, recurring test patterns).
- If testing is minimal or not practiced, do not force broad coverage rules by default.
- Add testing rules only when they match actual project practices or explicit user intent.
- Prefer incremental, realistic testing guidance over idealized requirements.

## Example: General Safety and Delivery Rule Candidates

Examples only. Include only what is supported by project evidence and useful for this project.

- Preserve backward compatibility of public APIs, routing contracts, and persisted data formats unless the user explicitly requests a breaking change.
- Call out migrations, data-shape changes, and required manual steps before finalizing output.
- Keep changes tightly scoped; if collateral edits are unavoidable, state them explicitly.
- For refactor tasks, keep behavior unchanged unless business-logic changes are explicitly requested.
- For bugfix tasks, include either an automated regression test or a clearly reproducible validation scenario.
- Run relevant checks (lint/tests/typecheck) for touched areas, or explicitly state why checks could not be run.
- In final summaries, always list residual risks, skipped checks, and known testing gaps.
- Do not leak secrets or credentials in logs, errors, or generated artifacts.
- Respect the repository package manager and lockfile; do not mix toolchains.
- Prefer fail-fast validation for invalid inputs over silent fallback behavior.

## If Information Cannot Be Determined

If a pattern cannot be determined after thorough exploration:

1. State what is unclear and why it matters.
2. Choose a conservative approach aligned with observed project patterns; if code evidence is unavailable, use the framework standard approach.
3. Mark uncertain decisions with: \`[VERIFY: description of what to verify]\`.

This should be rare - explore thoroughly before using this fallback.

`;
