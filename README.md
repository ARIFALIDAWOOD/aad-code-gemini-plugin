# AAD Governance — Gemini CLI Extension

This repository ships a Gemini CLI extension that enforces governance rules from `aad-governance/` before files are written. Enforcement combines proactive context (`GEMINI.md`) with reactive `BeforeTool` interception for `write_file`, `edit_file`, and `replace`.

## Features

- Typed rule registry with ENFORCED / RECOMMENDED / ASPIRATIONAL classification
- TypeScript analysis via the TypeScript compiler API; Python checks via safe regular expressions (v1)
- Auto-fix for a subset of rules (for example `let` → `const`, mutable Python defaults, bare `except` stubs)
- Blocking with reasons for unfixable ENFORCED violations (for example nested calls in the Pipes pillar)
- MCP tools `analyze_governance` and `check_compliance`
- Slash command prompt at `commands/governance/analyze.toml`

## Requirements

- Node.js 20+
- Gemini CLI with extension support

## Install locally

```bash
npm install
npm run build
gemini extensions link .
```

`npm run build` generates `GEMINI.md`, `dist/rules.json`, `dist/hook-handler.js`, and `mcp-server/dist/index.js`.

## Configuration

Environment variables read by `dist/hook-handler.js`:

- `GOVERNANCE_MAX_BYTES` — maximum analyzed payload size (default `102400`)

## Usage

- Context: `GEMINI.md` is referenced from `gemini-extension.json` as `contextFileName`
- Command: `/governance:analyze` (see `commands/governance/analyze.toml`)
- Hooks: `hooks/hooks.json` registers the governance hook for file-writing tools

## Verification

```bash
npm run typecheck
npm test
```

## Contributing

See `CONTRIBUTING.md`.
