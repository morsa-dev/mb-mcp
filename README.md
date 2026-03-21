# Memory Bank MCP

Public MCP server for Morsa.

Morsa is a governance layer for AI coding. This server is the public MCP entrypoint for generating Memory Bank baselines and returning supporting documentation context for supported project types.

This repository contains the open-source implementation of the server.

## Quick Start

Connect your MCP client to the hosted server endpoint.

- Hosted landing page: `https://mb-mcp.morsa.io/`
- MCP endpoint: `https://mb-mcp.morsa.io/mcp`
- Transport: Streamable HTTP
- Setup instructions for Cursor / Codex / Claude: https://mb-mcp.morsa.io/instructions

If you are using a self-hosted deployment, point your client to that deployment URL.

## Why Connect To This Server

Use this MCP if you want an agent to generate a project-specific Memory Bank without hand-writing the workflow yourself.

- `create` is the main capability: it returns executable instructions for building a Memory Bank from real codebase patterns
- it gives teams a consistent starting point for AI coding standards and project guidance
- it exposes that workflow through a public MCP interface, so it can be used from external agents and clients

## What This MCP Does

- `create`: returns instructions for generating a project-specific Memory Bank from a real codebase
- `docs_context`: returns documentation context that can be attached to supported flows when extra reference material is useful

## Supported Scope

`create` is currently intended for these project types:

- iOS
- Angular
- React
- Next.js
- Node.js

Current `docs_context` support is intentionally narrow:

- `stack`: `ios`, `angular`
- `version`: optional hint for version-aware documentation sources
- `detailLevel`: `compact`, `structured`

## Security / Safety

- does not receive the user's code or repository contents directly
- code inspection and file changes happen on the client-side coding agent, not on this server
- does not index repositories
- does not store user data or project contents
- does not require auth
- only returns instructions and documentation context

## Technical Details

- Node.js 22.9+
- official MCP TypeScript SDK
- stateless Streamable HTTP transport
- JSON response mode enabled
- public setup guide served at `/` and `/instructions`
- MCP endpoint served at `/mcp` by default

## Open Source

- `src/tools`: MCP tool registration
- `src/features/create`: instruction generation for Memory Bank flows
- `src/features/docsContext`: documentation-context orchestration
- `src/adapters/appleDocs`: Apple documentation lookup and extraction
- `src/adapters/angularDocs`: Angular documentation lookup and extraction

## Local Development

<details>
<summary>Show local setup</summary>

Local development is optional.

```bash
npm install
npm run dev
```

Checks:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Optional local `.env`:

```bash
PORT=3000
```

For localhost-only development:

```bash
HOST=127.0.0.1 npm run dev
```

</details>

## License

MIT

## Links

- Product website: https://www.morsa.io/
- Hosted instructions: https://mb-mcp.morsa.io/instructions
