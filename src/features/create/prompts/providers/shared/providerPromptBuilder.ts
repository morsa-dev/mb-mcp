export type ProviderPromptConfig = {
  providerLabel: "Cursor" | "Codex" | "Claude";
  introLine: string;

  // First bullet in "Baseline Output Targets" (single mandatory root file).
  entryFileLine: string;

  // Provider root folder, e.g. ".cursor", ".agents", ".claude".
  dirPrefix: string;
  ruleExtension: ".md" | ".mdc";
  // Provider-specific sentence about style/formatting of rule files.
  rulesStyleLine: string;
  // Provider-specific note describing how rules are discovered/applied by that provider.
  rulesLoadingLine: string;
  // Optional Cursor-only frontmatter guidance block appended to rules section.
  rulesFrontmatterGuide?: string;

  // Frontmatter injected into the "core" rule example block (Cursor uses alwaysApply).
  coreRuleFrontmatter?: string;
  // Frontmatter injected into generic rule template example block.
  ruleTemplateFrontmatter?: string;

  // Empty string means no prefix policy.
  skillPrefix: string;

  routingFileName?: "AGENTS.md" | "CLAUDE.md";
  // Provider-owned routing contract text rendered under routingFileName section.
  routingContractSection?: string;

  providerQualityChecks: string[];
};

const ensureValidConfig = (
  providerLabel: ProviderPromptConfig["providerLabel"],
  config: {
    dirPrefix: string;
    rulesLoadingLine: string;
    skillPrefix: string;
    routingFileName?: "AGENTS.md" | "CLAUDE.md";
    routingContractSection?: string;
    providerQualityChecks: string[];
  },
): void => {
  const errors: string[] = [];

  if (config.dirPrefix.length === 0) {
    errors.push("dirPrefix must not be empty");
  }
  if (!config.dirPrefix.startsWith(".")) {
    errors.push('dirPrefix must start with "."');
  }
  if (config.dirPrefix.includes("/")) {
    errors.push("dirPrefix must not contain '/'");
  }
  if (!config.rulesLoadingLine.trim()) {
    errors.push("rulesLoadingLine must not be empty");
  }
  if (config.skillPrefix.includes("/")) {
    errors.push("skillPrefix must not contain '/'");
  }
  if (
    config.providerQualityChecks.length === 0 ||
    config.providerQualityChecks.some((item) => item.trim().length === 0)
  ) {
    errors.push("providerQualityChecks must contain at least one non-empty checklist item");
  }
  if (config.routingFileName && !config.routingContractSection?.trim()) {
    errors.push("routingContractSection is required when routingFileName is set");
  }
  if (!config.routingFileName && config.routingContractSection?.trim()) {
    errors.push("routingContractSection must not be set when routingFileName is absent");
  }
  if (providerLabel === "Cursor" && config.routingFileName) {
    errors.push("routingFileName must not be set for Cursor");
  }
  if (providerLabel === "Codex" && config.routingFileName !== "AGENTS.md") {
    errors.push('routingFileName for Codex must be "AGENTS.md"');
  }
  if (providerLabel === "Claude" && config.routingFileName !== "CLAUDE.md") {
    errors.push('routingFileName for Claude must be "CLAUDE.md"');
  }

  if (errors.length > 0) {
    throw new Error(`[buildProviderPrompt] Invalid ${providerLabel} config:\n- ${errors.join("\n- ")}`);
  }
};

export const buildProviderPrompt = (config: ProviderPromptConfig): string => {
  const {
    providerLabel,
    introLine,
    entryFileLine,
    dirPrefix,
    ruleExtension,
    rulesStyleLine,
    rulesLoadingLine,
    rulesFrontmatterGuide,
    coreRuleFrontmatter,
    ruleTemplateFrontmatter,
    skillPrefix,
    routingFileName,
    routingContractSection,
    providerQualityChecks,
  } = config;

  ensureValidConfig(providerLabel, {
    dirPrefix,
    rulesLoadingLine,
    skillPrefix,
    ...(routingFileName ? { routingFileName } : {}),
    ...(routingContractSection ? { routingContractSection } : {}),
    providerQualityChecks,
  });

  const normalizedDirPrefix = dirPrefix.replace(/\/+$/, "");
  const generalRulePath = `${normalizedDirPrefix}/rules/general${ruleExtension}`;
  const ruleFilesLine = `2-8 focused rule files in \`${normalizedDirPrefix}/rules/*${ruleExtension}\``;
  const skillFilesLine = `3-8 focused skill files in \`${normalizedDirPrefix}/skills/*/SKILL.md\``;

  const prefixPolicy = skillPrefix.length === 0 ? "`(none)`" : `\`${skillPrefix}\``;
  const skillNameExample = `${skillPrefix}adding-feature`;
  const rulesFrontmatter = ruleTemplateFrontmatter?.trim() ? `${ruleTemplateFrontmatter.trim()}\n` : "";
  const coreFrontmatter = coreRuleFrontmatter?.trim() ? `${coreRuleFrontmatter.trim()}\n` : "";
  const rulesFrontmatterGuideBlock = rulesFrontmatterGuide?.trim() ? `\n${rulesFrontmatterGuide.trim()}` : "";

  const skillNamingBullets =
    skillPrefix.length === 0
      ? `- Folder name should be plain task-oriented name (example: \`adding-feature\`).
- Frontmatter \`name\` must match the folder name.
- Routing examples must reference the same non-prefixed names.
- Additional framework/domain skills must follow the same prefix policy.`
      : `- Folder name must start with \`${skillPrefix}\` (example: \`${skillPrefix}adding-feature\`).
- Frontmatter \`name\` must match the folder name and start with \`${skillPrefix}\`.
- Routing examples must reference the same prefixed names.
- Additional framework/domain skills must follow the same prefix policy.`;

  const routingSection = routingFileName
    ? `## ${routingFileName}

${routingContractSection?.trim()}`
    : "";

  return `# ${providerLabel} Provider Instructions

${introLine}

## Baseline Output Targets

Aim to generate a right-sized output set:
- ${entryFileLine}
- ${ruleFilesLine}
- ${skillFilesLine}
- Treat these ranges as starting guidance, not hard limits. Generate more files when project evidence or scope requires it.
- For small or low-confidence projects, prefer fewer high-value files over quota-filling.

## How ${providerLabel} Rules Work

- Rules are stored in \`${normalizedDirPrefix}/rules/\` and use the \`${ruleExtension}\` extension.
- Place project-specific topic rules in \`${normalizedDirPrefix}/rules/\`.
- Always include \`${generalRulePath}\`.
- ${rulesLoadingLine}
- ${rulesStyleLine}
- Each rule file should be compact and focused on one topic.
- Individual bullet points must be short, essential, and actionable.${rulesFrontmatterGuideBlock}

## How Skills (Agent Skills) Work

- Skills live in \`${normalizedDirPrefix}/skills/[skill-name]/SKILL.md\` (one folder per skill).
- Skills describe reusable workflows with concrete steps tied to this project.
- Each Skill must include:
  - Name and description in frontmatter
  - When to use (triggers)
  - Prerequisites (files to read first)
  - Step-by-step workflow with actual file paths
  - Anti-patterns to avoid

**Important distinction:**
- **Rules:** Short, static constraints. Reference patterns.
- **Skills:** Detailed workflows. Reference actual template files and paths.

### Quick distinction examples
- Rule example: "Use one naming convention for feature folders and files."
- Skill example: "Add a feature by following a step-by-step workflow from scaffolding to integration."
- Treat examples in this section as output-format templates; replace placeholders with project-specific content in final output.

## Rules vs Skills (Mandatory Split)

Use this split consistently:

- **Rules** (\`${normalizedDirPrefix}/rules/*${ruleExtension}\`):
  - short, atomic, always-on constraints
  - project invariants and delivery guardrails
  - concise and low-token (prefer compact bullet lists)
- **Skills** (\`${normalizedDirPrefix}/skills/*/SKILL.md\`):
  - multi-step workflows for specific task types
  - preconditions, execution sequence, and validation checklist
  - heavier, task-invoked guidance

If guidance is a short invariant that should apply broadly, it belongs in rules, not in a skill.

## Skill Naming Contract (${providerLabel})

Apply this contract to every generated skill:
- Prefix policy: ${prefixPolicy}.
${skillNamingBullets}

## Format of SKILL.md Files

\`\`\`markdown
---
name: '${skillNameExample}'
description: 'This skill should be used when adding a new feature module using existing project patterns'
---

# Adding Feature

## When to use
- Add a new feature module
- Extend an existing feature workflow

## Prerequisites
- Read existing feature module files to understand structure
- Read dependency registration and routing integration points

## Workflow

### Step 1: Create the module
1. Create the new module files in the target feature folder.
2. Follow structure and naming patterns from existing neighboring modules:

\`\`\`text
billing/
  billing-service.ts
  billing-types.ts
  billing-service.test.ts
\`\`\`

### Step 2: Wire it up
1. Register in parent/module index
2. Add routing/exports as needed

## Do not
- Leave placeholders in final output (replace with real project paths)
- Skip integration points

## Examples from codebase
- List real files/folders from the current project that this workflow follows
\`\`\`

## Format of ${ruleExtension} Rule Files

### File Template [example]

\`\`\`markdown
${rulesFrontmatter}## Standard: Naming and Structure

[One-sentence scope for this rule file.]

### Decisions
* Describe the repeatable decision and expected action.
* Use concise "condition -> action" wording.

### Exceptions
* Add only project-relevant exceptions.
\`\`\`

### Constraints

- Keep files concise (40-80 lines ideal, max ~90)
- No generic statements without project evidence
- Do not repeat same rule across multiple files
- Prefer positive rules ("Do X") over negative ("Do not Y") unless addressing specific anti-pattern

## ${generalRulePath}

Always include this file to define baseline always-on rules:

\`\`\`markdown
${coreFrontmatter}# General Behavior

- These rules apply to all files and tasks in this repository.
- Keep rule files and responses concise and focused on this codebase.
- Prefer following project-specific conventions over generic best practices.
\`\`\`

Keep this file minimal - it runs on every request.

${routingSection}

## Quality Self-Check Before Output

Before outputting, verify ALL of these:

- [ ] No duplicate or near-duplicate in rules or skills
- [ ] Guidance is backed by project evidence
- [ ] Rules and skills are not mixed incorrectly
- [ ] Each skill includes concrete, project-usable workflow steps
- [ ] Skill descriptions use explicit trigger wording
- [ ] Skill workflows reference real project paths, not placeholders
${providerQualityChecks.map((item) => `- [ ] ${item}`).join("\n")}

## Required Output Format

Output only a concise file creation report (no file bodies).

### Bank Creation Report
\`\`\`text
Generated files:
${routingFileName ? `- <project-root>/${routingFileName} - routing entry for rules and skills\n` : ""}- <project-root>/${generalRulePath} - baseline always-on rules
- <project-root>/${normalizedDirPrefix}/rules/architecture${ruleExtension} - architecture decisions and boundaries (if needed)
- <project-root>/${normalizedDirPrefix}/skills/${skillPrefix}adding-feature/SKILL.md - workflow for adding features
- <project-root>/${normalizedDirPrefix}/skills/${skillPrefix}adding-service/SKILL.md - workflow for adding services
- <project-root>/${normalizedDirPrefix}/skills/${skillPrefix}code-review/SKILL.md - project review checklist
- Additional generated files: one line per file, each with full path and short purpose
\`\`\`

Report rules:
- Use one line per generated file: \`<full file path> - <short purpose>\`.
- Include all generated rules and skills (and ${routingFileName ?? "routing file"} when applicable).
- Do not include full file contents.`.trim();
};
