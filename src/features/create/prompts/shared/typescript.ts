export const CREATE_TYPESCRIPT_SHARED = `# TypeScript Guidance

Apply this section only when the project uses TypeScript.

## TypeScript Evidence Gate

Before generating TypeScript-specific rules, verify from real project evidence:
- \`tsconfig*.json\` strictness profile (for example: \`strict\`, \`noImplicitAny\`, \`strictNullChecks\`, \`noUncheckedIndexedAccess\`).
- Alias/import strategy (\`baseUrl\`, \`paths\`) and whether boundaries rely on aliases.
- Type boundaries between API DTOs, domain models, and UI/view models.
- Async and error typing patterns (\`Promise\`, \`Observable\`, typed result wrappers).
- Runtime validation boundaries for external input (API/env/router params), if present.

## TypeScript Red Flags

Promote to rules only when repeated:
- Broad \`any\`/\`as any\` usage without narrowing strategy.
- Unsafe assertion chains (\`as unknown as X\`) instead of mapping/type guards.
- Non-null assertions (\`!\`) across async or API boundaries without safety checks.
- Inconsistent typing patterns for the same domain entities across modules.

## TypeScript Generation Locks

- Preserve detected compiler strictness and do not relax constraints without explicit evidence.
- Preserve detected alias/path strategy and module boundary conventions.
- Do not introduce unsafe typing shortcuts as default patterns.
- Prefer explicit boundary typing for external input and API mapping points.

## TypeScript Rule Candidates

Generate only topics supported by concrete project evidence:
- \`typescript\`: strictness, type boundaries, alias usage, async/error typing.
- \`services-data\`: API DTO mapping and boundary normalization, when tightly coupled with service layer.

## TypeScript Context-to-Rule Mapping

| Found in Codebase | Generate Rule Topic | Generate Skill |
|-------------------|---------------------|----------------|
| Strict TS config + clear DTO/domain boundaries | \`typescript\`, \`services-data\` | \`adding-service\` |
| Repeated unsafe assertions/\`any\` | \`typescript\` | \`common-anti-patterns\` |
| Path aliases + boundary constraints | \`typescript\`, \`architecture\` | \`code-review\` |

`;
