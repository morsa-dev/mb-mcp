type RoutingContractConfig = {
  routingFileName: "AGENTS.md" | "CLAUDE.md";
  dirPrefix: ".agents" | ".claude";
  routingOwnerLine: string;
  preRequiredSectionsLines?: string[];
  maintenanceUpdateLine: string;
  maintenanceExamplesLine: string;
  mergeStrategyLine: string;
};

export const buildRoutingContractSection = (config: RoutingContractConfig): string => {
  const {
    routingFileName,
    dirPrefix,
    routingOwnerLine,
    preRequiredSectionsLines,
    maintenanceUpdateLine,
    maintenanceExamplesLine,
    mergeStrategyLine,
  } = config;

  const rulesDir = `${dirPrefix}/rules`;
  const skillsDir = `${dirPrefix}/skills`;
  const generalRulePath = `${rulesDir}/general.md`;
  const preRequiredSectionsBlock =
    preRequiredSectionsLines && preRequiredSectionsLines.length > 0
      ? `${preRequiredSectionsLines.join("\n")}\n\n`
      : "";

  return `Use \`${routingFileName}\` as the routing contract for this provider.
${routingOwnerLine}
${preRequiredSectionsBlock}Required sections inside \`${routingFileName}\`:
1. Startup Read Order
- Always read \`${generalRulePath}\` first on every task.
- Then read only the minimum relevant task-specific rule files from \`${rulesDir}/\`.
- Then load task-specific skills from \`${skillsDir}/\`.
- Do not list all topic rules as unconditional startup reads.
- Startup section should describe selection logic, not a fixed full-file sequence.

2. File Routing Catalog (mandatory for every generated file)
- Include every generated file from \`${rulesDir}/\` and \`${skillsDir}/\`.
- For each file include:
  - full relative path
  - short purpose
  - explicit trigger in the form: "Read when ..."
- Use one line per file in this exact shape: \`Path | Purpose | Read when ...\`.
- No omissions: every generated rule/skill file must appear exactly once in this catalog.

3. Task Routing Matrix
- Map common task types to exact read sequences.
- Use concise lines in format: "Task -> Read order".
- Include at least:
  - add feature
  - add service or integration
  - code review
  - bug fix or troubleshooting

4. Conflict Resolution Order
- Apply rules before skills.
- If two skills conflict, prefer the more task-specific skill.
- If ambiguity remains, follow \`${generalRulePath}\` and mark uncertain parts with \`[VERIFY: ...]\`.

5. Maintenance Contract
- ${maintenanceUpdateLine}
- Remove stale paths immediately.
- ${maintenanceExamplesLine}

Do not duplicate full rule/skill bodies inside \`${routingFileName}\`; keep it as routing metadata.
${mergeStrategyLine}`;
};
