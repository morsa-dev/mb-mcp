import { buildProviderPrompt, type ProviderPromptConfig } from "./shared/providerPromptBuilder.js";

const cursorPromptConfig: ProviderPromptConfig = {
  providerLabel: "Cursor",
  introLine: "Use this section to enforce Cursor-specific output format and frontmatter rules.",

  entryFileLine: "1 `general.mdc` (always-applied global rules)",

  dirPrefix: ".cursor",
  ruleExtension: ".mdc",
  rulesLoadingLine: "Cursor loads `.cursor/rules/*.mdc` natively; rely on frontmatter to control global vs scoped rule activation.",
  rulesStyleLine: "The rest is markdown with headings and bullet points.",
  rulesFrontmatterGuide: `- At the top of each file is a frontmatter block with either:
  \`\`\`yaml
  ---
  alwaysApply: true
  ---
  \`\`\`
  OR with globs for file-specific rules:
  \`\`\`yaml
  ---
  alwaysApply: false
  description: Short scope summary for this rule
  globs:
    - "**/*"
    - "src/**/*"
    - "**/tests/**/*"
  ---
  \`\`\`
- Use \`alwaysApply: true\` only for rules required in every agent session.
- For scoped rules, set \`alwaysApply: false\` and define \`globs\` explicitly.`,

  coreRuleFrontmatter: `---
alwaysApply: true
---`,
  ruleTemplateFrontmatter: `---
alwaysApply: true
---`,

  skillPrefix: "",

  providerQualityChecks: [
    "Frontmatter is explicit:\n  - `alwaysApply: true` means no `globs`\n  - scoped rules must set `alwaysApply: false` and define `globs`",
  ],
};

export const CURSOR_PROVIDER_PROMPT = buildProviderPrompt(cursorPromptConfig);
