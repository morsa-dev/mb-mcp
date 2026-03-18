export const CREATE_STACK_SELECTION = `# MemoryBank Create Flow

You are preparing a compact, project-specific rule bank for coding tasks.
The goal is to reduce repeated ambiguity and avoid costly rework by extracting stable patterns from the real codebase.

## Required action before generation

Select stack and call this tool again with arguments.stack.
Pass stack as a direct tool arguments object: {"stack":"ios"}.
Do not wrap it as nested payload like {"arguments":{"stack":"ios"}}.

JSON-RPC shape reminder:
params.name = "create", params.arguments = {"stack":"ios"}.

Allowed values:
- ios: iOS projects (Swift, SwiftUI, UIKit).
- angular: Angular projects (routing, templates, DI, RxJS/signals).
- react: React projects (components, hooks, routing, state/data patterns).
- nextjs: Next.js projects (App/Pages Router, server/client boundaries, data fetching/caching).
- nodejs: Node.js backend projects (API/services/data layer, auth, validation, jobs).
- other: stack cannot be identified confidently (or does not match known stack options).

Accepted aliases (normalized automatically):
- \`swift\`, \`swiftui\`, \`uikit\` -> \`ios\`
- \`ng\` -> \`angular\`
- \`reactjs\` -> \`react\`
- \`next\` -> \`nextjs\`
- \`node\`, \`express\`, \`nestjs\` -> \`nodejs\`
- \`default\`, \`unsure\` -> \`other\`

Example arguments:
- {"stack":"ios"}
- {"stack":"angular"}
- {"stack":"react"}
- {"stack":"nextjs"}
- {"stack":"nodejs"}
- {"stack":"other"}

Do not generate rule files or skills in this step.
This step is only stack selection and flow routing.`;
