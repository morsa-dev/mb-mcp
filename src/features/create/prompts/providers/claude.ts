import { buildProviderPrompt, type ProviderPromptConfig } from "./shared/providerPromptBuilder.js";
import { buildRoutingContractSection } from "./shared/routingContractBuilder.js";

const claudePromptConfig: ProviderPromptConfig = {
  providerLabel: "Claude",
  introLine: "Use this section to enforce Claude Code-specific output format.",

  entryFileLine: "1 root `CLAUDE.md` entry file",

  dirPrefix: ".claude",
  ruleExtension: ".md",
  rulesLoadingLine:
    "Claude can load `.claude/rules/*.md` natively; use `CLAUDE.md` to route task entry points and skill selection, not as the only source of rule truth.",
  rulesStyleLine: "Use short markdown headings and concise actionable bullet points.",

  skillPrefix: "mb-",

  routingFileName: "CLAUDE.md",
  routingContractSection: buildRoutingContractSection({
    routingFileName: "CLAUDE.md",
    dirPrefix: ".claude",
    routingOwnerLine: "Agents should rely on `CLAUDE.md` to decide which files to read for each task.",
    preRequiredSectionsLines: [
      "Do not treat `CLAUDE.md` as a replacement for native `.claude/rules/*.md` loading.",
    ],
    maintenanceUpdateLine: "Update `CLAUDE.md` whenever a rule/skill file is added, removed, renamed, or repurposed.",
    maintenanceExamplesLine: "Keep all examples aligned with current `mb-` skill prefixes and file names.",
    mergeStrategyLine:
      "If `CLAUDE.md` already exists, preserve project-specific sections and merge/update only relevant routing sections.",
  }),

  providerQualityChecks: [
    "`CLAUDE.md` startup order keeps only `.claude/rules/general.md` as always-read and routes other rule files by task relevance",
    "`CLAUDE.md` file routing catalog lists every generated rule/skill exactly once using `Path | Purpose | Read when ...`",
    "`CLAUDE.md` includes startup read order and task routing matrix that references current `.claude/rules` and `.claude/skills` paths",
    "`CLAUDE.md` is present and routes to real rule/skill paths",
    "`.claude/rules/general.md` is present",
    "Every skill folder and frontmatter name starts with `mb-`",
  ],
};

export const CLAUDE_PROVIDER_PROMPT = buildProviderPrompt(claudePromptConfig);
