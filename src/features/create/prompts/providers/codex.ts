import { buildProviderPrompt, type ProviderPromptConfig } from "./shared/providerPromptBuilder.js";
import { buildRoutingContractSection } from "./shared/routingContractBuilder.js";

const codexPromptConfig: ProviderPromptConfig = {
  providerLabel: "Codex",
  introLine: "Use this section to enforce Codex-specific output format.",

  entryFileLine: "1 root `AGENTS.md` entry file",

  dirPrefix: ".agents",
  ruleExtension: ".md",
  rulesLoadingLine:
    "Codex does not auto-load `.agents/rules/*.md` as native rule files; treat them as project-managed guidance and route them explicitly from AGENTS files.",
  rulesStyleLine: "Use short markdown headings and concise actionable bullet points.",

  skillPrefix: "",

  routingFileName: "AGENTS.md",
  routingContractSection: buildRoutingContractSection({
    routingFileName: "AGENTS.md",
    dirPrefix: ".agents",
    routingOwnerLine: "Agents should rely on the AGENTS hierarchy to decide which files to read for each task.",
    preRequiredSectionsLines: [
      "Document native Codex discovery order explicitly:",
      "- apply nearest `AGENTS.override.md` first (if present)",
      "- then merge nearest `AGENTS.md`",
      "- continue from current working directory up to repo root",
    ],
    maintenanceUpdateLine:
      "Update AGENTS routing entries whenever a rule/skill file is added, removed, renamed, or repurposed.",
    maintenanceExamplesLine: "Keep all examples aligned with current non-prefixed skill names.",
    mergeStrategyLine:
      "If AGENTS files already exist, preserve project-specific sections and merge/update only relevant routing sections.",
  }),

  providerQualityChecks: [
    "`AGENTS.md` startup order keeps only `.agents/rules/general.md` as always-read and routes other rule files by task relevance",
    "`AGENTS.md` file routing catalog lists every generated rule/skill exactly once using `Path | Purpose | Read when ...`",
    "`AGENTS.md` (and `AGENTS.override.md` when used) defines read order and `Read when ...` entries for every generated rule and skill",
    "`AGENTS.md` is present and routes to real rule/skill paths",
    "`.agents/rules/general.md` is present",
    "Every skill folder and frontmatter name follows non-prefixed naming",
  ],
};

export const CODEX_PROVIDER_PROMPT = buildProviderPrompt(codexPromptConfig);
