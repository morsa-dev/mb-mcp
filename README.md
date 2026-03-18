# mb-mcp

Standalone Node.js/TypeScript MCP server for Memory Bank workflows.

This repository is intentionally small: one MCP server, two public tools, no auth, no persistence, and no transport-specific hacks beyond the official MCP TypeScript SDK.

## Tools

- `create`: returns execution instructions for generating a project-specific Memory Bank from a real codebase
- `docs_context`: searches official documentation context and returns compact snippets plus optional structured enrichment

Current `docs_context` support is intentionally narrow:
- supported stack: `ios`
- supported detail levels: `compact`, `structured`

## Runtime

- Node.js 22.9+
- official MCP TypeScript SDK
- stateless Streamable HTTP transport
- JSON response mode enabled
- no authentication

Default endpoints:
- MCP: `http://127.0.0.1:3000/`
- Health: `http://127.0.0.1:3000/healthz`

## Development

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
npm start
```

Optional local port override:

```bash
cp .env.example .env
```

## Minimal Smoke Test

Start the server:

```bash
npm start
```

Initialize against the MCP endpoint:

```bash
curl -sS \
  -X POST http://127.0.0.1:3000/ \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-06-18",
      "capabilities":{},
      "clientInfo":{"name":"smoke-test","version":"0.0.0"}
    }
  }'
```

List tools:

```bash
curl -sS \
  -X POST http://127.0.0.1:3000/ \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/list",
    "params":{}
  }'
```

## Environment Variables

- `PORT`: bind port, default `3000`; loaded from optional `.env` by `npm run dev` and `npm start`
- `HOST`: optional shell env override, default `127.0.0.1`
- `MCP_PATH`: optional shell env override, default `/`
- `ALLOWED_HOSTS`: optional shell env override when binding beyond localhost

## Project Layout

- `src/server.ts`: process entrypoint and graceful shutdown
- `src/http`: HTTP transport wiring
- `src/mcp`: MCP server factory and server metadata
- `src/tools`: MCP tool registration layer
- `src/features/create`: `create` prompt assembly logic
- `src/features/docsContext`: `docs_context` payload orchestration and shaping
- `src/adapters/appleDocs`: Apple documentation search and content extraction
- `test`: contract and unit tests for public behavior

## License

MIT
