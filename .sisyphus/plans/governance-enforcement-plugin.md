# Governance Enforcement Plugin for Gemini CLI

## TL;DR

> **Quick Summary**: Build a Gemini CLI extension that enforces the 7 Pillars and anti-patterns from `aad-governance/` on AI-generated code. Uses dual enforcement: proactive (GEMINI.md context + MCP tools) so Gemini knows the rules before writing, and reactive (BeforeTool hooks) that intercept file writes to detect violations, auto-fix what's fixable, and block+instruct on the rest.
>
> **Deliverables**:
> - Gemini CLI extension (`gemini-extension.json` + MCP server + hooks + commands + GEMINI.md)
> - Machine-readable rule schema (TypeScript types + JSON rules)
> - Rule engine with detection for 30+ governance rules across Python and TypeScript
> - Auto-fix capability for ~8-10 rules that can be safely transformed
> - BeforeTool hook for `write_file` and `edit_file` intercepting non-compliant code
> - MCP tools for on-demand governance analysis
> - Custom commands (`/governance:analyze`, `/governance:fix`)
> - Full TDD test suite (vitest) covering all rule detectors and hook I/O
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Rule Schema → Rule Engine → Hook Handler → Integration → Verification

---

## Context

### Original Request
Create a Gemini CLI plugin that enforces governance principles from `aad-governance/` on code being written by it. The governance document is currently just recommendations — we need enforcement when enabled. The plugin must itself be consistent with the governance document's style.

### Interview Summary
**Key Discussions**:
- Plugin type: Gemini CLI Extension (not VS Code, not .rules file)
- Enforcement tiers: ENFORCED → block+auto-fix, RECOMMENDED → auto-fix+warn, ASPIRATIONAL → warn+info
- Language support: Both Python and TypeScript from day one
- Behavior: Auto-fix where possible, block+instruct where not
- Rule updates: Bake governance rules into extension at build time
- Test strategy: TDD with vitest

**Research Findings**:
- Gemini CLI extensions use: `gemini-extension.json` manifest, MCP servers, hooks, commands, skills, GEMINI.md
- Hooks are defined in `hooks/hooks.json` within the extension directory
- BeforeTool hooks can `decision: "deny"` (block) or modify `hookSpecificOutput.tool_input` (auto-fix)
- `@google/gemini-cli-sdk` provides TypeScript `hook()` function with `runAsCommand()`
- Security extension (github.com/gemini-cli-extensions/security) is reference implementation
- Only ~8-10 of 30+ governance rules are safely auto-fixable; the rest are detect-and-block

### Metis Review
**Identified Gaps** (addressed):
- **Auto-fix feasibility gap**: Metis identified that most governance rules CAN'T be auto-fixed. Plan now explicitly classifies rules as auto-fixable vs detect+block vs advisory. ✅
- **Hook registration mechanism**: Research confirmed extensions CAN define hooks in `hooks/hooks.json`. ✅
- **Machine-readable rule source**: Plan includes a typed rule schema as canonical source, not markdown parsing. ✅
- **Hook I/O "silence is mandatory"**: Hook communicates via stdin/stdout JSON only; stray output corrupts protocol. Tests cover this. ✅
- **Self-compliance**: Extension must follow its own governance rules (neverthrow, zod, Readonly, const-only, Result types). ✅

---

## Work Objectives

### Core Objective
Build a Gemini CLI extension that makes the `aad-governance/` principles enforceable — not just advisory — by intercepting AI-generated code, detecting violations, auto-fixing what's safe, and blocking+instructing on the rest.

### Concrete Deliverables
- `gemini-extension.json` — Extension manifest
- `hooks/hooks.json` + `hooks/governance-hook.ts` — BeforeTool hook for write_file/edit_file
- `mcp-server/` — MCP server with governance analysis tools
- `commands/` — Custom commands for `/governance:analyze` and `/governance:fix`
- `GEMINI.md` — Governance context digest for model awareness
- `src/domain/rules/` — Typed rule definitions (canonical source of truth)
- `src/domain/engine.ts` — Pure rule engine (detect + classify + suggest fixes)
- `src/domain/fixers/` — Auto-fix transformations for fixable rules
- `src/infrastructure/parsers/` — Python and TypeScript AST analysis
- `src/infrastructure/hook-handler.ts` — stdin/stdout JSON hook handler
- Full vitest test suite covering every rule, every fixer, hook I/O, and MCP tool

### Definition of Done
- [ ] `npx vitest run` → all tests pass
- [ ] `npx tsc --noEmit` → zero errors (strict mode)
- [ ] `gemini extensions link .` → extension loads without errors
- [ ] Gemini generates `let x = 5` → hook auto-fixes to `const x = 5` + logs the change
- [ ] Gemini generates `catch (e) { }` → hook blocks with reason explaining bare catch is forbidden
- [ ] Gemini writes compliant code → hook passes through without modification
- [ ] `/governance:analyze` command returns structured rule violations for a file
- [ ] Extension's own source code passes its own governance checks (self-compliance)

### Must Have
- All ENFORCED-tier rules implemented as detectors
- Auto-fix for the ~8-10 safely fixable rules
- Block+instruct (with PATTERNS.md examples) for non-fixable ENFORCED rules
- GEMINI.md with distilled governance context
- BeforeTool hook on write_file and edit_file
- MCP tools: `analyze_governance`, `check_compliance`
- Custom commands: `/governance:analyze`
- TDD test suite with vitest
- Extension follows own governance principles (neverthrow, zod, Readonly, const-only)

### Must NOT Have (Guardrails)
- No VS Code extension or IDE integration — CLI extension only
- No property-based testing (fast-check) in v1 — example-based vitest tests only
- No Docker/CI/CD/deployment infrastructure in this plan
- No Actor pattern / concurrency — extension processes one hook at a time
- No observability (structured logging, health checks) — this is a CLI extension, not a service
- No parsing governance markdown at runtime — typed rule schema is the canonical source
- No auto-fix for rules that require semantic understanding (Result type conversion, function splitting, pipe refactoring) — these are detect-and-block only
- No Python AST analysis via tree-sitter in v1 — Python rules use regex-based detection initially, with AST as a future enhancement

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: YES (TDD)
- **Framework**: vitest
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Rule Engine**: Use Bash (vitest) — Run test suites, assert pass/fail
- **Hook Handler**: Use Bash (node pipe) — Feed JSON via stdin, assert stdout JSON
- **MCP Tools**: Use Bash (node) — Call MCP tool functions, assert result shapes
- **Extension Integration**: Use Bash (gemini CLI) — Verify extension loads, commands work

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — can start immediately):
├── Task 1: Project scaffolding + build system + vitest setup [quick]
├── Task 2: Rule schema design + TypeScript types [deep]
├── Task 3: GEMINI.md governance digest [writing]
├── Task 4: Extension manifest + MCP server scaffold [quick]
└── Task 5: Hook handler I/O layer (stdin/stdout JSON) [deep]

Wave 2 (Core Engine — after Wave 1):
├── Task 6: TypeScript rule detectors (Pillars 1-7 + anti-patterns) [deep]
├── Task 7: Python rule detectors (Pillars 1-7 + anti-patterns) [deep]
├── Task 8: Auto-fixer engine + fixable rules [deep]
├── Task 9: Rule severity classification (ENFORCED/RECOMMENDED/ASPIRATIONAL) [quick]
└── Task 10: GEMINI.md generator (from rule schema) [quick]

Wave 3 (Integration — after Wave 2):
├── Task 11: BeforeTool hook integration (write_file + edit_file) [deep]
├── Task 12: MCP tool: analyze_governance [unspecified-high]
├── Task 13: MCP tool: check_compliance [unspecified-high]
├── Task 14: Custom command: /governance:analyze [quick]
└── Task 15: Build script: bake rules from schema + generate dist [quick]

Wave 4 (Polish + Self-Compliance — after Wave 3):
├── Task 16: Self-compliance audit: extension follows own rules [deep]
├── Task 17: Hook error handling + edge cases (invalid JSON, timeouts, parse failures) [deep]
├── Task 18: README + installation instructions [writing]
└── Task 19: Integration test: end-to-end hook flow with sample Gemini output [deep]

Wave FINAL (Verification — after ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1    | -          | 5, 6-10, 11-19 |
| 2    | 1          | 6, 7, 8, 9, 10 |
| 3    | -          | 10 |
| 4    | 1          | 12-14 |
| 5    | 1          | 11 |
| 6    | 2          | 11 |
| 7    | 2          | 11 |
| 8    | 2, 6       | 11 |
| 9    | 2          | 11 |
| 10   | 2, 3       | 15 |
| 11   | 5, 6, 7, 8, 9 | 16, 19 |
| 12   | 4, 6, 7, 9 | 16 |
| 13   | 4, 6, 7, 9 | 16 |
| 14   | 4, 12      | 16 |
| 15   | 10          | 19 |
| 16   | 11, 12, 13 | F2 |
| 17   | 11          | 19 |
| 18   | 15          | - |
| 19   | 11, 15, 17 | F3 |

### Agent Dispatch Summary

- **Wave 1**: 5 tasks — T1 → `quick`, T2 → `deep`, T3 → `writing`, T4 → `quick`, T5 → `deep`
- **Wave 2**: 5 tasks — T6 → `deep`, T7 → `deep`, T8 → `deep`, T9 → `quick`, T10 → `quick`
- **Wave 3**: 5 tasks — T11 → `deep`, T12 → `unspecified-high`, T13 → `unspecified-high`, T14 → `quick`, T15 → `quick`
- **Wave 4**: 4 tasks — T16 → `deep`, T17 → `deep`, T18 → `writing`, T19 → `deep`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Project scaffolding + build system + vitest setup

  **What to do**:
  - Initialize Node.js project with `package.json`, `tsconfig.json` (strict: true, all required strict flags per governance)
  - Install dependencies: `@modelcontextprotocol/sdk`, `neverthrow`, `zod`, `vitest`, `typescript`, `esbuild`
  - Set up `vitest.config.ts` with TypeScript path mapping
  - Create directory structure following 4-layer architecture:
    ```
    src/
    ├── domain/           # Pure business logic, zero external deps
    │   ├── types.ts       # Rule, Violation, Fix, Severity types
    │   ├── rules/         # Rule definitions (canonical source)
    │   ├── engine.ts      # Pure rule engine (detect + classify + suggest)
    │   └── fixers/        # Auto-fix transformations (pure functions)
    ├── application/       # Orchestration — composes domain functions
    │   └── analyze.ts     # Pipeline: parse → detect → classify → fix
    ├── infrastructure/    # AST parsing, file I/O, external tooling
    │   └── parsers/       # TypeScript and Python code analysis
    └── boundary/          # Hook handler, MCP server, commands
        ├── hook-handler.ts
        ├── mcp-server.ts
        └── commands/
    ```
  - Configure `esbuild` for bundling with proper platform/target settings
  - Add `npm scripts`: `build`, `test`, `typecheck`, `dev`

  **Must NOT do**:
  - Do NOT use `any` type anywhere
  - Do NOT use default exports
  - Do NOT use `let` for variables that aren't reassigned
  - Do NOT add Docker, CI/CD, or deployment configuration

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 2, 3 (no dependencies)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 5, 6-19
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `aad-governance/ARCHITECTURE.md:88-119` — 4-layer directory structure to follow
  - `aad-governance/PRINCIPLES.md:369-383` — Tooling rules (strict tsconfig, neverthrow, zod)
  - `aad-governance/PATTERNS.md:261-303` — Pipe composition patterns for the engine
  - Security extension structure: `gemini-extension.json` + `mcp-server/` + `commands/`

  **API/Type References**:
  - `@modelcontextprotocol/sdk` — MCP server SDK for tool registration
  - `neverthrow` — Result type library (ENFORCED by governance)
  - `zod` — Runtime validation library (ENFORCED by governance)

  **External References**:
  - Gemini CLI extensions guide: https://google-gemini.github.io/gemini-cli/docs/extensions/getting-started-extensions.html
  - Gemini CLI hooks reference: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md

  **WHY Each Reference Matters**:
  - 4-layer architecture: The extension must follow its own governance rules about layer boundaries
  - strict tsconfig: Governance ENFORCES `strict: true` plus additional strict flags
  - neverthrow/zod: Required by governance — no exceptions, no bare throws, no any types

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] `npx vitest run` → passes (placeholder test)
  - [ ] `npx tsc --noEmit` → zero errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Project builds and tests pass
    Tool: Bash
    Preconditions: Project scaffolding complete
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0, no errors
      3. Run: npm run typecheck
      4. Assert: exit code 0
      5. Run: npm test
      6. Assert: exit code 0, at least 1 test passes
    Expected Result: Build, typecheck, and test all succeed
    Failure Indicators: TypeScript errors, build failures, test failures
    Evidence: .sisyphus/evidence/task-1-build-test.txt

  Scenario: tsconfig matches governance requirements
    Tool: Bash (grep)
    Preconditions: tsconfig.json exists
    Steps:
      1. Run: grep -c '"strict": true' tsconfig.json
      2. Assert: count >= 1
      3. Run: grep '"noUnusedLocals"' tsconfig.json
      4. Assert: found
      5. Run: grep '"verbatimModuleSyntax"' tsconfig.json
      6. Assert: found
    Expected Result: All governance-mandated tsconfig flags present
    Failure Indicators: Missing strict flags
    Evidence: .sisyphus/evidence/task-1-tsconfig.txt
  ```

  **Commit**: YES (groups with Tasks 2-5)
  - Message: `feat(plugin): scaffold project structure and rule schema`
  - Files: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/`, `esbuild*`

---

- [ ] 2. Rule schema design + TypeScript types

  **What to do**:
  - TDD: Write failing tests first for the rule schema types and validation
  - Define canonical rule schema in `src/domain/types.ts`:
    ```typescript
    // Enforcement tiers from governance docs
    type EnforcementTier = "enforced" | "recommended" | "aspirational";

    // Each rule has: id, pillar, tier, language, description, detection pattern, fixability
    type GovernanceRule = Readonly<{
      id: string;                    // e.g., "immutability-no-let"
      pillar: Pillar;                // e.g., "immutability"
      tier: EnforcementTier;         // from governance doc
      language: "typescript" | "python" | "both";
      title: string;                 // human-readable title
      description: string;           // what the rule checks
      detectionStrategy: "ast" | "regex" | "heuristic";
      fixable: boolean;               // can this rule be auto-fixed?
      fixStrategy?: FixStrategy;      // how to fix it (if fixable)
      patterns: ReadonlyArray<DetectionPattern>;  // what to look for
      examples: Readonly<{
        bad: string;                  // code that violates
        good: string;                 // code that complies
        explanation: string;           // why it matters
      }>;
    }>;

    type Violation = Readonly<{
      ruleId: string;
      severity: EnforcementTier;
      message: string;
      line: number;
      column: number;
      snippet: string;
      suggestedFix?: string;
    }>;

    type AnalysisResult = Readonly<{
      violations: ReadonlyArray<Violation>;
      filePath: string;
      language: "typescript" | "python";
    }>;
    ```
  - Create Zod schemas for runtime validation of all types
  - Define the `Pillar` enum type (7 pillars)
  - Define `FixStrategy` discriminated union: `regex-replace`, `add-modifier`, `prepend-statement`, `wrap-readonly`

  **Must NOT do**:
  - Do NOT use `any` or type assertions
  - Do NOT use `interface` for data shapes — use `type` per governance
  - Do NOT use mutable arrays/objects — `ReadonlyArray` and `Readonly<T>` everywhere
  - Do NOT parse governance markdown — the rule schema IS the canonical source

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 1, 3, 4, 5 (task 2 doesn't depend on build being done)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 6, 7, 8, 9, 10
  - **Blocked By**: Task 1 (needs package.json for vitest)

  **References**:

  **Pattern References**:
  - `aad-governance/PATTERNS.md:105-123` — Immutability patterns (Readonly, z.object readonly)
  - `aad-governance/PATTERNS.md:130-162` — Result type patterns (neverthrow)
  - `aad-governance/PATTERNS.md:530-554` — Discriminated union pattern matching (assertNever)

  **API/Type References**:
  - `aad-governance/PRINCIPLES.md:388-394` — Enforcement tier definitions (ENFORCED, RECOMMENDED, ASPIRATIONAL)
  - `aad-governance/PRINCIPLES.md:114-133` — Total Typing rules (no any, explicit return types)

  **Test References**:
  - Vitest basics: `describe`, `it`, `expect` pattern

  **External References**:
  - zod readonly: https://zod.dev/?id=readonly

  **WHY Each Reference Matters**:
  - Immutability patterns: The rule schema itself must use Readonly/ReadonlyArray
  - Result types: Rule detection functions must return Result, not throw
  - Discriminated unions: FixStrategy must use kind discriminant for exhaustive matching
  - Enforcement tiers: These map 1:1 to the governance doc's ENFORCED/RECOMMENDED/ASPIRATIONAL

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file created: `src/domain/types.test.ts`
  - [ ] `npx vitest run src/domain/types.test.ts` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Zod schema validates a well-formed GovernanceRule
    Tool: Bash (node)
    Preconditions: Types and Zod schemas implemented
    Steps:
      1. Create a test script that attempts to parse a valid GovernanceRule JSON through the Zod schema
      2. Run it: expect success (no ZodError)
    Expected Result: Valid rule data passes schema validation
    Failure Indicators: ZodError thrown on valid data
    Evidence: .sisyphus/evidence/task-2-schema-validation.txt

  Scenario: Zod schema rejects malformed GovernanceRule (missing required fields)
    Tool: Bash (node)
    Preconditions: Zod schemas implemented
    Steps:
      1. Create a test script that passes incomplete rule data (missing `pillar`, `tier`, `fixable`)
      2. Run it: expect ZodError with specific field names in error message
    Expected Result: ZodError thrown identifying missing fields
    Failure Indicators: Schema accepts incomplete data silently
    Evidence: .sisyphus/evidence/task-2-schema-rejection.txt
  ```

  **Commit**: YES (groups with Tasks 1, 3-5)
  - Message: `feat(plugin): scaffold project structure and rule schema`
  - Files: `src/domain/types.ts`, `src/domain/types.test.ts`

---

- [ ] 3. GEMINI.md governance digest

  **What to do**:
  - Create `GEMINI.md` at extension root that serves as the proactive governance context
  - This file is loaded into Gemini's context every session, so it must be concise but comprehensive
  - Structure it as a condensed reference of the 7 Pillars with key rules and anti-patterns
  - Include enforcement tier information so the model knows which rules are hard requirements
  - Keep total length under ~2000 tokens (it's loaded every session)
  - Extract the most impactful rules from each pillar:
    - Immutability: let→const, .push()→spread, Readonly<T>
    - Pipes: no nested calls, use pipe() or .andThen()
    - Railways: Result types, no throw in business logic, no null/None
    - Total Typing: no any, explicit return types, strict mode
    - Small Functions: ≤10 stmts Python, ≤15 lines TypeScript
    - Pattern Matching: exhaustive switch/match, assertNever/assert_never
    - Pure Functions: no global state, no direct I/O, dependency injection
  - Include key anti-patterns table from PRINCIPLES.md

  **Must NOT do**:
  - Do NOT copy the full governance docs verbatim — this must be a digest
  - Do NOT exceed ~2000 tokens — GEMINI.md is loaded every session
  - Do NOT include code examples — point to rule IDs that the MCP tools can look up
  - Do NOT include ASPIRATIONAL rules in the digest — focus on ENFORCED and RECOMMENDED only

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with all other Wave 1 tasks
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 10 (GEMINI.md generator)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `aad-governance/PRINCIPLES.md:1-404` — Full principles (source for digest)
  - `aad-governance/PATTERNS.md:1-1245` — Full patterns (source for anti-pattern tables)

  **WHY Each Reference Matters**:
  - PRINCIPLES.md: The authoritative source for what rules exist, their enforcement tiers, and their forbidden/required tables
  - PATTERNS.md: Before/after code examples that show what the model SHOULD generate vs what it should NOT

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: GEMINI.md contains all 7 pillars with enforcement tiers
    Tool: Bash (grep)
    Preconditions: GEMINI.md written
    Steps:
      1. Run: grep -c "ENFORCED" GEMINI.md
      2. Assert: count >= 7 (one per pillar)
      3. Run: grep -c "immutability\|pipes\|railways\|total.typing\|small.functions\|pattern.matching\|pure.functions" GEMINI.md
      4. Assert: count >= 7
      5. Run: wc -w GEMINI.md
      6. Assert: word count < 3000 (approximate token budget)
    Expected Result: All 7 pillars present, ENFORCED tier noted, under token budget
    Failure Indicators: Missing pillar, no tier markers, excessive length
    Evidence: .sisyphus/evidence/task-3-gemini-md.txt
  ```

  **Commit**: YES (groups with Tasks 1, 2, 4, 5)
  - Message: `feat(plugin): scaffold project structure and rule schema`
  - Files: `GEMINI.md`

---

- [ ] 4. Extension manifest + MCP server scaffold

  **What to do**:
  - Create `gemini-extension.json` following the security extension pattern:
    ```json
    {
      "name": "aad-governance",
      "version": "0.1.0",
      "contextFileName": "GEMINI.md",
      "mcpServers": {
        "governanceServer": {
          "command": "node",
          "args": ["${extensionPath}/mcp-server/dist/index.js"]
        }
      }
    }
    ```
  - Create `mcp-server/` directory with:
    - `src/index.ts` — MCP server entry point (imports and registers tools)
    - `package.json` with `@modelcontextprotocol/sdk` dependency
    - `tsconfig.json` with strict settings
  - Register placeholder MCP tools: `analyze_governance`, `check_compliance`
  - Each tool should accept file content and language, return a list of violations
  - Tools use Zod for input schema validation (governance: "Parse, Don't Validate")

  **Must NOT do**:
  - Do NOT implement the full analysis logic yet — placeholder tools only
  - Do NOT use `any` in tool schemas or handlers
  - Do NOT use `console.log` in MCP server code (stdout is for JSON-RPC)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 1, 2, 3, 5
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 12, 13, 14
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - Security extension structure: `gemini-extension.json` + `mcp-server/` + `commands/`

  **API/Type References**:
  - `@modelcontextprotocol/sdk` — McpServer, registerTool API
  - `zod` — Input schema definition

  **External References**:
  - Gemini CLI extension writing guide: https://google-gemini.github.io/gemini-cli/docs/extensions/writing-extensions.html
  - Security extension: https://github.com/gemini-cli-extensions/security

  **WHY Each Reference Matters**:
  - Security extension: Proven reference pattern for the exact same extension pattern we're building
  - MCP SDK: Official API for registering tools that Gemini can call
  - Zod: Governance ENFORCES "Parse, Don't Validate" — all tool inputs validated via Zod

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `mcp-server/src/index.test.ts`
  - [ ] `npx vitest run` → passes

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: MCP server starts and lists tools
    Tool: Bash (node)
    Preconditions: MCP server built
    Steps:
      1. Build: npm run build
      2. Start server: node mcp-server/dist/index.js
      3. Send JSON-RPC initialize + tools/list request
      4. Assert: response contains "analyze_governance" and "check_compliance" tools
    Expected Result: Server responds with tool list containing both governance tools
    Failure Indicators: Server crashes, tools not listed, Zod validation errors
    Evidence: .sisyphus/evidence/task-4-mcp-tools.txt

  Scenario: Extension manifest is valid
    Tool: Bash (node)
    Preconditions: gemini-extension.json exists
    Steps:
      1. Parse gemini-extension.json with node
      2. Assert: has "name", "version", "contextFileName", "mcpServers" fields
      3. Assert: mcpServers.governanceServer exists
      4. Assert: contextFileName equals "GEMINI.md"
    Expected Result: Valid manifest with governanceServer and GEMINI.md context
    Failure Indicators: Missing fields, invalid JSON, wrong structure
    Evidence: .sisyphus/evidence/task-4-manifest.txt
  ```

  **Commit**: YES (groups with Tasks 1-3, 5)
  - Message: `feat(plugin): scaffold project structure and rule schema`
  - Files: `gemini-extension.json`, `mcp-server/`

---

- [ ] 5. Hook handler I/O layer (stdin/stdout JSON)

  **What to do**:
  - TDD: Write failing tests for hook I/O first
  - Create `src/boundary/hook-handler.ts` — the critical piece that reads JSON from stdin, processes it, and writes JSON to stdout
  - The hook MUST follow the "silence is mandatory" rule: zero console.log, all output goes to stdout as JSON, all diagnostics go to stderr
  - Structure as a pure function: `processHook(input: HookInput): Result<HookOutput, HookError>`
  - HookInput type: `{ tool_name: string; tool_input: { path?: string; content?: string; ... } }`
  - HookOutput type: `{ decision?: "deny"; reason?: string; hookSpecificOutput?: { tool_input: Record<string, unknown>; additionalContext?: string } }`
  - The handler should:
    1. Parse stdin JSON
    2. If tool_name is not `write_file` or `edit_file`, return no-op (empty object)
    3. If `content` field is present (write_file), extract the code
    4. If `new_string` field is present (edit_file), extract the code patch
    5. Route to analysis engine (dependency injection — the handler itself is pure)
    6. Based on analysis result, return: no-op, deny with reason, or modified tool_input
  - Create a thin CLI wrapper (`hooks/governance-hook.ts`) that reads stdin, calls processHook, writes stdout
  - The CLI wrapper is the only impure boundary; processHook is pure and testable

  **Must NOT do**:
  - Do NOT use `console.log` anywhere in the hook handler — stdout is reserved for JSON output
  - Do NOT use `process.exit()` with code 0 on success — just output JSON and exit naturally
  - Do NOT use `process.exit(2)` unless the decision is to block — exit code 2 means block, 0 means allow/modify
  - Do NOT implement the full analysis engine yet — processHook should accept an analysis function via dependency injection

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 2, 3, 4
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (needs package.json and tsconfig)

  **References**:

  **Pattern References**:
  - `aad-governance/PATTERNS.md:558-665` — Pure function boundaries (Domain vs Boundary layer)
  - `aad-governance/PATTERNS.md:129-162` — Result type patterns for error handling

  **API/Type References**:
  - Gemini CLI hooks reference: BeforeTool hook input/output schema
  - `@google/gemini-cli-sdk` — `hook()` function and `runAsCommand()`

  **External References**:
  - Gemini CLI hooks: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md
  - Gemini CLI hooks writing guide: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/writing-hooks.md

  **WHY Each Reference Matters**:
  - Pure function boundaries: The hook handler MUST be pure (stdin→JSON out) with I/O isolated at the boundary
  - Result types: Hook errors must use neverthrow Result, not throw exceptions
  - BeforeTool hook schema: Must match exact JSON format for input/output, including exit code behavior

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/boundary/hook-handler.test.ts`
  - [ ] Tests for: valid JSON passthrough, denial with reason, tool_input modification, invalid JSON handling, empty input
  - [ ] `npx vitest run src/boundary/hook-handler.test.ts` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Hook passes through non-write_file tools unchanged
    Tool: Bash (node pipe)
    Preconditions: Hook handler built
    Steps:
      1. Create JSON: {"tool_name": "read_file", "tool_input": {"path": "src/test.ts"}}
      2. Pipe to: node dist/hook-handler.js
      3. Parse stdout JSON
      4. Assert: output is empty object {} (no-op)
    Expected Result: Non-write_file tools pass through without modification
    Failure Indicators: Hook tries to analyze read operations, returns unexpected fields
    Evidence: .sisyphus/evidence/task-5-passthrough.txt

  Scenario: Hook denies a write with violation reason
    Tool: Bash (node pipe)
    Preconditions: Hook handler built with mock analyzer that returns violations
    Steps:
      1. Create JSON: {"tool_name": "write_file", "tool_input": {"path": "test.ts", "content": "try { x() } catch(e) { }"}}
      2. Pipe to mock-analyzer-equipped hook
      3. Parse stdout JSON
      4. Assert: decision field equals "deny"
      5. Assert: reason field contains "bare catch" or "empty catch"
    Expected Result: Hook returns deny decision with explanatory reason
    Failure Indicators: No denial, empty reason, stdout corruption
    Evidence: .sisyphus/evidence/task-5-deny.txt

  Scenario: Hook modifies tool_input for auto-fixable violation
    Tool: Bash (node pipe)
    Preconditions: Hook handler built with mock analyzer that returns auto-fixable violation
    Steps:
      1. Create JSON: {"tool_name": "write_file", "tool_input": {"path": "test.ts", "content": "let x = 5;"}}
      2. Pipe to mock-analyzer-equipped hook with auto-fix for let→const
      3. Parse stdout JSON
      4. Assert: hookSpecificOutput.tool_input.content contains "const x = 5;"
      5. Assert: hookSpecificOutput.additionalContext contains explanation
    Expected Result: Hook returns modified content with let→const
    Failure Indicators: Original content unchanged, missing additionalContext, stdout corruption
    Evidence: .sisyphus/evidence/task-5-autofix.txt

  Scenario: Invalid JSON input is handled gracefully
    Tool: Bash (node pipe)
    Preconditions: Hook handler built
    Steps:
      1. Pipe invalid JSON: "not json at all"
      2. Run: node dist/hook-handler.js
      3. Assert: process exits with code 1 (error, not block)
      4. Assert: stderr contains meaningful error message
      5. Assert: stdout is empty or valid JSON error response
    Expected Result: Invalid input handled gracefully without crash
    Failure Indicators: Uncaught exception, non-empty stdout, exit code 2 (which would block)
    Evidence: .sisyphus/evidence/task-5-error-handling.txt
  ```

  **Commit**: YES (groups with Tasks 1-4)
  - Message: `feat(plugin): scaffold project structure and rule schema`
  - Files: `src/boundary/hook-handler.ts`, `src/boundary/hook-handler.test.ts`, `hooks/`

---

- [ ] 6. TypeScript rule detectors (Pillars 1-7 + anti-patterns)

  **What to do**:
  - TDD: Write failing tests for each rule detector BEFORE implementation
  - Define rule instances in `src/domain/rules/typescript-rules.ts` — one `GovernanceRule` per rule
  - TypeScript rules to implement (organized by pillar):

  **Pillar 1: Immutability** (all auto-fixable or detect-only):
  - `immutability-no-let` — detect `let` declarations → auto-fix: `let→const`
  - `immutability-no-push` — detect `.push()`, `.splice()`, `.sort()` mutation → detect+block (context-dependent)
  - `immutability-readonly-params` — detect mutable array/object params → detect+block
  - `immutability-no-object-mutation` — detect `obj.prop = value` → detect+block

  **Pillar 2: Pipes** (detect only — cannot auto-fix nested calls):
  - `pipes-no-nested-calls` — detect `f(g(h(x)))` patterns → detect+block

  **Pillar 3: Railways** (detect only — cannot auto-fix to Result types):
  - `railways-no-throw` — detect `throw` in non-boundary code → detect+block
  - `railways-no-null-return` — detect `return null` / `return undefined` → detect+block
  - `railways-no-bare-catch` — detect `catch (e) { }` / `except Exception: pass` → auto-fix: add comment or suggest pattern

  **Pillar 4: Total Typing** (detect only — cannot infer types):
  - `total-typing-no-any` — detect `any`, `Any`, `as any`, `@ts-ignore` → detect+block
  - `total-typing-explicit-return` — detect functions without return type annotations → detect+block
  - `total-typing-no-type-assertion` — detect `as SomeType` → detect+block

  **Pillar 5: Small Functions** (detect only — cannot auto-split):
  - `small-functions-max-lines` — detect functions >15 lines → detect+block

  **Pillar 6: Pattern Matching** (partial auto-fix):
  - `pattern-matching-exhaustive-switch` — detect switch without `assertNever` default → auto-fix: add `default: assertNever(x)`

  **Pillar 7: Pure Functions** (detect only):
  - `pure-functions-no-global-state` — detect `Date.now()`, `Math.random()`, direct `fetch()` → detect+block

  **Anti-Patterns** (mostly detect, some auto-fixable):
  - `antipattern-no-default-export` — detect `export default` → auto-fix: convert to named export
  - `antipattern-no-import-star` — detect `import *` → detect+block
  - `antipattern-no-console-log` — detect `console.log()` in src/ (not in test/) → detect+block
  - `antipattern-mutable-default-params` — detect function params with mutable defaults → detect+block

  - Each rule detector is a pure function: `(code: string, filePath: string) => Result<ReadonlyArray<Violation>, DomainError>`
  - Auto-fixable rules also include a `fix` function: `(code: string, violation: Violation) => Result<string, DomainError>`

  **Must NOT do**:
  - Do NOT use regex for complex pattern detection where AST is needed (function size, nested calls)
  - Do NOT implement Python rules in this task — Python is Task 7
  - Do NOT use tree-sitter yet — use TypeScript Compiler API (`ts.createSourceFile`) for TS analysis
  - Do NOT implement rules that require semantic understanding (Result type conversion, function splitting)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Task 7 (Python rules, independent)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11, 16
  - **Blocked By**: Task 2 (needs rule schema types)

  **References**:

  **Pattern References**:
  - `aad-governance/PRINCIPLES.md:64-182` — All 7 pillars with forbidden/required tables
  - `aad-governance/PRINCIPLES.md:274-296` — Anti-patterns table
  - `aad-governance/PATTERNS.md:36-123` — Immutability patterns (before/after)
  - `aad-governance/PATTERNS.md:260-378` — Pipe composition patterns
  - `aad-governance/PATTERNS.md:130-258` — Result type patterns

  **API/Type References**:
  - TypeScript Compiler API: `ts.createSourceFile`, `ts.SyntaxKind`
  - `src/domain/types.ts` — GovernanceRule, Violation, FixStrategy types

  **Test References**:
  - Each rule needs 2+ test cases: one violation detection, one compliant-code passthrough

  **WHY Each Reference Matters**:
  - Pillars: Each forbidden/required table directly maps to detector logic
  - Patterns: Before/after examples are the exact test cases for detectors
  - TypeScript Compiler API: Needed for AST-based detection (function size, nested calls)

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/domain/rules/typescript-rules.test.ts`
  - [ ] Each rule has at least 2 test cases (violation + compliant)
  - [ ] `npx vitest run src/domain/rules/typescript-rules.test.ts` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: let→const auto-fix works
    Tool: Bash (vitest)
    Preconditions: TypeScript rule detectors implemented
    Steps:
      1. Run: npx vitest run -t "immutability-no-let"
      2. Assert: all tests pass (violation detection + auto-fix)
      3. Verify: fix("let x = 5") returns "const x = 5"
    Expected Result: let declarations detected and auto-fixed to const
    Failure Indicators: False positives on for-loop lets, fix doesn't produce const
    Evidence: .sisyphus/evidence/task-6-let-const.txt

  Scenario: bare catch detection works
    Tool: Bash (vitest)
    Preconditions: TypeScript rule detectors implemented
    Steps:
      1. Run: npx vitest run -t "railways-no-bare-catch"
      2. Assert: catches `catch (e) { }` and `catch { }`
      3. Assert: passes through `catch (e) { handleError(e); }`
    Expected Result: Bare catches detected, non-empty catches passed
    Failure Indicators: False negatives on single-line catches, false positives on meaningful catches
    Evidence: .sisyphus/evidence/task-6-bare-catch.txt

  Scenario: any type detection works
    Tool: Bash (vitest)
    Preconditions: TypeScript rule detectors implemented
    Steps:
      1. Run: npx vitest run -t "total-typing-no-any"
      2. Assert: detects `any`, `as any`, `@ts-ignore`
      3. Assert: does NOT flag `AnyComponent` or string containing "any" in comments
    Expected Result: any types detected, legitimate uses of "any" string not flagged
    Failure Indicators: False positives on variable names containing "any"
    Evidence: .sisyphus/evidence/task-6-no-any.txt
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(plugin): implement rule detectors for TypeScript and Python`
  - Files: `src/domain/rules/typescript-rules.ts`, `src/domain/rules/typescript-rules.test.ts`

---

- [ ] 7. Python rule detectors (Pillars 1-7 + anti-patterns)

  **What to do**:
  - TDD: Write failing tests for each Python rule detector BEFORE implementation
  - Define rule instances in `src/domain/rules/python-rules.ts`
  - Python rules use regex-based detection initially (no tree-sitter dependency in v1)
  - Same pillars as TypeScript but Python-specific patterns:

  **Pillar 1: Immutability**:
  - `immutability-no-mutable-class` — detect Python mutable classes → detect+block
  - `immutability-frozen-model` — detect `BaseModel` without `ConfigDict(frozen=True)` → detect+block
  - `immutability-no-list-in-sig` — detect `list[T]` in function signatures → detect+block (should be `Sequence[T]` or `tuple[T, ...]`)
  - `immutability-no-dict-in-sig` — detect `dict[K, V]` in function signatures → detect+block (should be `Mapping[K, V]`)
  - `immutability-mutable-default` — detect `def f(x=[])` / `def f(x={})` → auto-fix: `def f(x=None); x = x or []`

  **Pillar 2: Pipes**:
  - `pipes-no-nested-calls` — detect `f(g(h(x)))` patterns → detect+block

  **Pillar 3: Railways**:
  - `railways-no-raise-in-logic` — detect `raise` in non-boundary code → detect+block
  - `railways-no-return-none` — detect `return None` as failure signal → detect+block
  - `railways-no-bare-except` — detect `except Exception: pass` / `except: pass` → auto-fix: replace with structured error handling

  **Pillar 4: Total Typing**:
  - `total-typing-no-any` — detect `Any`, `# type: ignore` → detect+block
  - `total-typing-future-annotations` — detect missing `from __future__ import annotations` → auto-fix: prepend line

  **Pillar 5: Small Functions**:
  - `small-functions-max-statements` — detect functions >10 statements → detect+block

  **Pillar 7: Pure Functions**:
  - `pure-functions-no-datetime-now` — detect `datetime.now()` without injection → detect+block
  - `pure-functions-no-os-getenv-direct` — detect `os.getenv()` in business logic → detect+block

  **Anti-Patterns**:
  - `antipattern-no-from-import-star` — detect `from module import *` → detect+block
  - `antipattern-no-global-mutable` — detect `global` keyword → detect+block
  - `antipattern-no-circular-import` — detect circular import patterns → detect+block

  **Must NOT do**:
  - Do NOT use tree-sitter or AST parsing for Python in v1 — regex-based detection only
  - Do NOT implement TypeScript rules — that's Task 6
  - Do NOT add Python as a runtime dependency — the extension is TypeScript-only; Python analysis is regex-based within TS

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Task 6 (TypeScript rules, independent)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 2 (needs rule schema types)

  **References**:

  **Pattern References**:
  - `aad-governance/PRINCIPLES.md:308-338` — Python-specific rules (pydantic frozen, from __future__, mypy strict)
  - `aad-governance/PRINCIPLES.md:274-296` — Anti-patterns table (Python column)

  **WHY Each Reference Matters**:
  - Python-specific rules: The forbidden/required tables for Python are different from TypeScript
  - Anti-patterns: Python column lists `from X import *`, `global`, mutable defaults, etc.

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/domain/rules/python-rules.test.ts`
  - [ ] Each rule has at least 2 test cases (violation + compliant)
  - [ ] `npx vitest run src/domain/rules/python-rules.test.ts` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Mutable default parameter detected and auto-fixed
    Tool: Bash (vitest)
    Preconditions: Python rule detectors implemented
    Steps:
      1. Run: npx vitest run -t "immutability-mutable-default"
      2. Assert: detects `def f(x=[]):` and `def f(x={}):`
      3. Assert: auto-fix produces `def f(x=None):` with `x = x or []` on next line
    Expected Result: Mutable defaults detected and auto-fixed to None sentinel pattern
    Failure Indicators: False positives on `x=[]` in comments, broken auto-fix
    Evidence: .sisyphus/evidence/task-7-mutable-default.txt

  Scenario: bare except detection works
    Tool: Bash (vitest)
    Preconditions: Python rule detectors implemented
    Steps:
      1. Run: npx vitest run -t "railways-no-bare-except-python"
      2. Assert: detects `except Exception: pass` and `except: pass`
      3. Assert: passes through `except SpecificException as e:`
    Expected Result: Bare except clauses detected, specific exceptions passed
    Failure Indicators: False negatives on whitespace variations
    Evidence: .sisyphus/evidence/task-7-bare-except.txt
  ```

  **Commit**: YES (groups with Task 6)
  - Message: `feat(plugin): implement rule detectors for TypeScript and Python`
  - Files: `src/domain/rules/python-rules.ts`, `src/domain/rules/python-rules.test.ts`

---

- [ ] 8. Auto-fixer engine + fixable rules

  **What to do**:
  - TDD: Write failing tests for the fixer engine first
  - Create `src/domain/fixers/` directory with:
    - `fixer-engine.ts` — Pure function: `(code: string, violations: ReadonlyArray<Violation>) => Result<string, DomainError>`
    - `fixers/typescript-fixers.ts` — Auto-fix implementations for fixable TS rules
    - `fixers/python-fixers.ts` — Auto-fix implementations for fixable Python rules
  - Fixable rules and their transformations:

  **TypeScript auto-fixes**:
  - `let x = 5` → `const x = 5`
  - `switch (x) { ... }` without default → add `default: assertNever(x)`
  - `export default function` → `export function` (named export)
  - `catch (e) { }` → `catch (e) { /* TODO: handle error - see governance PATTERNS.md */ }`

  **Python auto-fixes**:
  - `def f(x=[]):` → `def f(x=None):` + next line `x = x or []`
  - `def f(x={}):` → `def f(x=None):` + next line `x = x or {}`
  - Missing `from __future__ import annotations` → prepend line

  - The fixer engine applies fixes in order from top to bottom (so line numbers stay valid)
  - Each fix returns a `Result<FixedCode, DomainError>` — never throws
  - If any fix fails, the entire fix operation returns err (no partial fixes)

  **Must NOT do**:
  - Do NOT attempt to auto-fix rules that require semantic understanding (Result types, function splitting, pipe refactoring)
  - Do NOT apply multiple fixes that could interfere with each other without careful ordering
  - Do NOT modify code if the fix would produce invalid syntax — validate after fixing

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 6 for rule IDs and violation types)
  - **Parallel Group**: Wave 2 (after Task 6)
  - **Blocks**: Task 11
  - **Blocked By**: Task 2, Task 6

  **References**:

  **Pattern References**:
  - `aad-governance/PATTERNS.md:36-123` — Before/after examples that serve as auto-fix targets

  **WHY Each Reference Matters**:
  - Before/after examples: The "Good" column in each pattern table is the target output for auto-fixes

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/domain/fixers/fixer-engine.test.ts`
  - [ ] Each fixer has test cases: input with violation → fixed output
  - [ ] `npx vitest run src/domain/fixers/` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: let→const fix applied correctly
    Tool: Bash (vitest)
    Preconditions: Fixer engine implemented
    Steps:
      1. Run: npx vitest run -t "fixer-let-to-const"
      2. Input: "let x = 5;\nlet y = 10;"
      3. Assert: output is "const x = 5;\nconst y = 10;"
      4. Input: "for (let i = 0; i < 10; i++)" (legitimate let in for-loop)
      5. Assert: NOT flagged (let in for-loop is acceptable per governance)
    Expected Result: let→const in declarations, but NOT in for-loop initializers
    Failure Indicators: Over-aggressive fix of legitimate let uses
    Evidence: .sisyphus/evidence/task-8-fix-let-const.txt

  Scenario: Multiple fixes applied in correct order
    Tool: Bash (vitest)
    Preconditions: Fixer engine implemented
    Steps:
      1. Create code with both let and missing annotations violations
      2. Run fixer engine with both violations
      3. Assert: both fixes applied, no line number corruption
    Expected Result: Both fixes applied correctly without interfering
    Failure Indicators: Second fix corrupts line numbers from first fix
    Evidence: .sisyphus/evidence/task-8-multiple-fixes.txt
  ```

  **Commit**: YES (groups with Tasks 6, 7, 9)
  - Message: `feat(plugin): implement rule detectors and auto-fixers`
  - Files: `src/domain/fixers/`

---

- [ ] 9. Rule severity classification (ENFORCED/RECOMMENDED/ASPIRATIONAL)

  **What to do**:
  - Create `src/domain/rules/rule-registry.ts` — canonical registry of all rule definitions
  - Each rule entry includes its `enforcementTier` from the governance docs:
    - ENFORCED rules: `immutability-no-let`, `railways-no-throw`, `total-typing-no-any`, etc.
    - RECOMMENDED rules: `pattern-matching-exhaustive-switch`, `pure-functions-no-global-state` (context-dependent)
    - ASPIRATIONAL rules: none in v1 (frontier patterns like dependent types)
  - Create a function `classifyViolation(violation: Violation): ViolationAction` that determines what to do:
    ```typescript
    type ViolationAction = Readonly<{
      type: "auto-fix" | "block" | "warn";
      severity: EnforcementTier;
      message: string;
      suggestedFix?: string;
    }>;
    ```
    - ENFORCED + fixable → auto-fix
    - ENFORCED + not fixable → block with reason + PATTERNS.md example
    - RECOMMENDED + fixable → auto-fix + additionalContext warning
    - RECOMMENDED + not fixable → warn with suggestion
    - ASPIRATIONAL → warn as info only

  **Must NOT do**:
  - Do NOT change the enforcement tiers from what's defined in the governance docs
  - Do NOT make ASPIRATIONAL rules block — they are advisory only

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 6, 7, 8
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 2 (needs Violation and EnforcementTier types)

  **References**:

  **Pattern References**:
  - `aad-governance/PRINCIPLES.md:386-393` — Enforcement tiers table (ENFORCED, RECOMMENDED, ASPIRATIONAL)

  **WHY Each Reference Matters**:
  - Enforcement tiers: The exact definitions of what each tier means for code review and CI

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/domain/rules/rule-registry.test.ts`
  - [ ] Each tier has at least one test case
  - [ ] `npx vitest run src/domain/rules/rule-registry.test.ts` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: ENFORCED fixable violation classifies as auto-fix
    Tool: Bash (vitest)
    Steps:
      1. Create a violation with severity "enforced" and fixable=true
      2. Call classifyViolation
      3. Assert: type === "auto-fix"
    Expected Result: ENFORCED + fixable → auto-fix
    Failure Indicators: Returns "block" or "warn" for fixable ENFORCED rule
    Evidence: .sisyphus/evidence/task-9-classify-fix.txt

  Scenario: ENFORCED unfixable violation classifies as block
    Tool: Bash (vitest)
    Steps:
      1. Create a violation with severity "enforced" and fixable=false
      2. Call classifyViolation
      3. Assert: type === "block"
      4. Assert: message contains explanation and pattern reference
    Expected Result: ENFORCED + unfixable → block with explanatory message
    Failure Indicators: Returns "auto-fix" or "warn" for unfixable ENFORCED rule
    Evidence: .sisyphus/evidence/task-9-classify-block.txt
  ```

  **Commit**: YES (groups with Tasks 6-8, 10)
  - Message: `feat(plugin): implement rule detectors, auto-fixers, and classification`
  - Files: `src/domain/rules/rule-registry.ts`, `src/domain/rules/rule-registry.test.ts`

---

- [ ] 10. GEMINI.md generator (from rule schema)

  **What to do**:
  - Create `src/application/generate-gemini-md.ts` — a pure function that takes the rule registry and generates the `GEMINI.md` content
  - The generated GEMINI.md should be a condensed version of the governance rules tailored for Gemini's context window
  - Structure: 7 pillar headings, key rules under each, enforcement tier markers, anti-pattern table
  - Keep output under ~2000 tokens (this gets loaded into context every session)
  - Build script in `scripts/generate-gemini-md.ts` that reads the rule registry and writes to `GEMINI.md`
  - This ensures GEMINI.md is always in sync with the rule schema (canonical source)

  **Must NOT do**:
  - Do NOT hardcode GEMINI.md content — it should be generated from the rule schema
  - Do NOT include code examples in GEMINI.md — that would bloat the context; use rule IDs that MCP tools can look up

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 2 for schema and Task 3 for initial content)
  - **Parallel Group**: Wave 2 (after 2 and 3)
  - **Blocks**: Task 15
  - **Blocked By**: Task 2, Task 3

  **References**:

  **Pattern References**:
  - `GEMINI.md` (from Task 3) — The hand-written digest to compare against

  **WHY Each Reference Matters**:
  - The hand-written GEMINI.md serves as the reference for what content should be generated

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/application/generate-gemini-md.test.ts`
  - [ ] `npx vitest run src/application/` → passes

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Generated GEMINI.md contains all 7 pillars
    Tool: Bash (node)
    Steps:
      1. Run: npx ts-node scripts/generate-gemini-md.ts
      2. Read the output GEMINI.md
      3. Grep for each pillar name
      4. Assert: all 7 pillars present
    Expected Result: All 7 pillars with ENFORCED tier markers
    Failure Indicators: Missing pillar, no enforcement markers
    Evidence: .sisyphus/evidence/task-10-gemini-md-gen.txt
  ```

  **Commit**: YES (groups with Tasks 6-9)
  - Message: `feat(plugin): implement rule detectors, auto-fixers, and GEMINI.md generator`
  - Files: `src/application/generate-gemini-md.ts`, `scripts/generate-gemini-md.ts`

---

- [ ] 11. BeforeTool hook integration (write_file + edit_file)

  **What to do**:
  - Create `hooks/hooks.json` — extension-level hook configuration:
    ```json
    {
      "BeforeTool": [
        {
          "matcher": "write_file|edit_file|replace",
          "hooks": [
            {
              "name": "governance-enforcement",
              "type": "command",
              "command": "node ${extensionPath}/dist/hook-handler.js"
            }
          ]
        }
      ]
    }
    ```
  - Update `src/boundary/hook-handler.ts` to integrate the analysis pipeline:
    1. Parse stdin JSON (already done in Task 5)
    2. Route to analysis engine with the full rule registry
    3. Classify violations by severity
    4. For auto-fixable ENFORCED violations → return modified `tool_input`
    5. For unfixable ENFORCED violations → return `decision: "deny"` with reason
    6. For RECOMMENDED violations → return modified `tool_input` with `additionalContext` warning
    7. For ASPIRATIONAL violations → return `additionalContext` info only (allow write)
    8. For no violations → return empty object (passthrough)
  - Wire up the dependency injection: hook handler receives analyzer function, calls it
  - Handle `edit_file` tool_input format (may contain `old_string`/`new_string` instead of full `content`)

  **Must NOT do**:
  - Do NOT call `console.log` — stdout is reserved for JSON output (golden rule)
  - Do NOT block RECOMMENDED or ASPIRATIONAL violations — only ENFORCED violations block
  - Do NOT modify code for violations that can't be safely fixed — block+instruct instead

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 5, 6, 7, 8, 9)
  - **Parallel Group**: Wave 3 (after Wave 2)
  - **Blocks**: Tasks 16, 17, 19
  - **Blocked By**: Tasks 5, 6, 7, 8, 9

  **References**:

  **Pattern References**:
  - `aad-governance/PATTERNS.md:558-665` — Pure function boundaries (boundary layer pattern)
  - Gemini CLI hooks reference: BeforeTool hook schema with decision, reason, tool_input fields

  **API/Type References**:
  - `src/domain/engine.ts` — Rule engine (from Task integration)
  - `src/domain/fixers/fixer-engine.ts` — Auto-fixer engine

  **WHY Each Reference Matters**:
  - Boundary pattern: The hook handler is THE boundary layer — it translates between Gemini CLI's hook protocol and our pure domain functions
  - BeforeTool schema: Must match exact JSON format for input/output

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `src/boundary/hook-handler.test.ts` (extended)
  - [ ] Integration tests: full pipeline from stdin JSON to stdout JSON
  - [ ] `npx vitest run src/boundary/` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Full pipeline auto-fixes let→const
    Tool: Bash (node pipe)
    Steps:
      1. Create JSON input for write_file with content containing "let x = 5"
      2. Pipe through full hook handler
      3. Parse output JSON
      4. Assert: hookSpecificOutput.tool_input.content contains "const x = 5"
      5. Assert: additionalContext explains what was fixed
    Expected Result: let→const auto-fix applied with explanatory context
    Failure Indicators: Content unchanged, no additionalContext, invalid JSON output
    Evidence: .sisyphus/evidence/task-11-autofix-pipeline.txt

  Scenario: Full pipeline blocks unfixable ENFORCED violation
    Tool: Bash (node pipe)
    Steps:
      1. Create JSON input for write_file with content containing nested calls "fetch(parse(validate(raw)))"
      2. Pipe through full hook handler
      3. Parse output JSON
      4. Assert: decision === "deny"
      5. Assert: reason contains "nested calls" and references the Pipes pillar
    Expected Result: Unfixable violation blocked with explanatory reason referencing governance pillar
    Failure Indicators: Code passed through, no denial, missing reason
    Evidence: .sisyphus/evidence/task-11-block-pipeline.txt

  Scenario: edit_file with patch-style content handled
    Tool: Bash (node pipe)
    Steps:
      1. Create JSON input for edit_file with old_string/new_string fields
      2. Pipe through hook handler
      3. Verify the handler processes the new_string (not the entire file)
      4. If violation in new_string, assert denial or modification of new_string field
    Expected Result: edit_file patches analyzed for violations
    Failure Indicators: Handler crashes on edit_file format, ignores new_string
    Evidence: .sisyphus/evidence/task-11-edit-file.txt
  ```

  **Commit**: YES (groups with Tasks 12-15)
  - Message: `feat(plugin): integrate hook handler, MCP tools, and commands`
  - Files: `hooks/hooks.json`, `src/boundary/hook-handler.ts`, integration code

---

- [ ] 12. MCP tool: analyze_governance

  **What to do**:
  - Implement the `analyze_governance` MCP tool in `mcp-server/src/tools/`
  - Tool accepts: `{ content: string; language: "typescript" | "python"; filePath?: string }`
  - Tool returns: `{ violations: Violation[]; summary: { total: number; enforced: number; recommended: number; fixable: number } }`
  - Wire into MCP server's `registerTool` call
  - Use Zod for input validation (governance: "Parse, Don't Validate")

  **Must NOT do**:
  - Do NOT use `console.log` in MCP server (stdout reserved for JSON-RPC)
  - Do NOT throw exceptions — use neverthrow Result types

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 13, 14
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 4, 6, 7, 9

  **References**:

  **API/Type References**:
  - `@modelcontextprotocol/sdk` — registerTool, inputSchema
  - `src/domain/engine.ts` — Analysis pipeline

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `mcp-server/src/tools/analyze-governance.test.ts`
  - [ ] `npx vitest run mcp-server/` → passes

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: analyze_governance detects violations in TypeScript
    Tool: Bash (node)
    Steps:
      1. Call analyze_governance with TypeScript code containing "let x = 5"
      2. Parse result JSON
      3. Assert: violations array contains immutability-no-let violation
      4. Assert: summary.enforced >= 1
    Expected Result: Violations detected with correct severity classification
    Failure Indicators: Empty violations array, wrong severity
    Evidence: .sisyphus/evidence/task-12-analyze-ts.txt
  ```

  **Commit**: YES (groups with Tasks 11, 13-15)
  - Message: `feat(plugin): integrate hook handler, MCP tools, and commands`
  - Files: `mcp-server/src/tools/analyze-governance.ts`, test file

---

- [ ] 13. MCP tool: check_compliance

  **What to do**:
  - Implement the `check_compliance` MCP tool — a focused version that checks a single rule against a code snippet
  - Tool accepts: `{ content: string; ruleId: string; language: "typescript" | "python" }`
  - Tool returns: `{ compliant: boolean; violations?: Violation[]; suggestedFix?: string }`
  - Useful when the model wants to quickly verify compliance with a specific rule before writing

  **Must NOT do**:
  - Do NOT duplicate the analyze_governance logic — check_compliance should call the same engine with a rule filter

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 12, 14
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 4, 6, 7, 9

  **References**:

  **API/Type References**: Same as Task 12

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Test file: `mcp-server/src/tools/check-compliance.test.ts`

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: check_compliance for a specific rule
    Tool: Bash (node)
    Steps:
      1. Call check_compliance with ruleId="immutability-no-let" and content containing "let x = 5"
      2. Assert: compliant === false
      3. Call check_compliance with ruleId="immutability-no-let" and content containing "const x = 5"
      4. Assert: compliant === true
    Expected Result: Single-rule compliance check works correctly
    Failure Indicators: Wrong compliant result, missing violation
    Evidence: .sisyphus/evidence/task-13-check-compliance.txt
  ```

  **Commit**: YES (groups with Tasks 11, 12, 14, 15)
  - Files: `mcp-server/src/tools/check-compliance.ts`, test file

---

- [ ] 14. Custom command: /governance:analyze

  **What to do**:
  - Create `commands/governance/analyze.toml` — Gemini CLI custom command definition
  - The command should trigger governance analysis on the current file or provided path
  - Command format: `/governance:analyze [file-path]` — analyzes the file and returns structured violations
  - If no file path provided, analyze the currently open file
  - The TOML file defines the command, its description, and the prompt it sends to Gemini

  **Must NOT do**:
  - Do NOT implement analysis logic in the command — it delegates to the `analyze_governance` MCP tool

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 12, 13, 15
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 16
  - **Blocked By**: Task 12 (needs MCP tool to exist)

  **References**:

  **External References**:
  - Gemini CLI commands: https://google-gemini.github.io/gemini-cli/docs/extensions/writing-extensions.html (Step 4)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: /governance:analyze command registered
    Tool: Bash
    Preconditions: Extension installed via `gemini extensions link .`
    Steps:
      1. Run: gemini extensions list
      2. Assert: "aad-governance" appears in extension list
      3. Assert: command "governance:analyze" is listed
    Expected Result: Extension and command registered correctly
    Failure Indicators: Extension not found, command not listed
    Evidence: .sisyphus/evidence/task-14-command-registration.txt
  ```

  **Commit**: YES (groups with Tasks 11-13, 15)
  - Files: `commands/governance/analyze.toml`

---

- [ ] 15. Build script: bake rules from schema + generate dist

  **What to do**:
  - Create `scripts/build.ts` that:
    1. Reads all rule definitions from `src/domain/rules/`
    2. Generates `dist/rules.json` (machine-readable rule registry)
    3. Runs `generate-gemini-md.ts` to produce `GEMINI.md`
    4. Compiles TypeScript via esbuild
    5. Produces `dist/hook-handler.js`, `dist/mcp-server/index.js`
  - Add npm scripts: `build`, `build:rules`, `build:gemini-md`
  - Verify the build output is complete and all files are present

  **Must NOT do**:
  - Do NOT parse governance markdown at build time — rules come from the TypeScript schema
  - Do NOT bundle the full governance docs into the extension — only the generated digest

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 2, 10)
  - **Parallel Group**: Wave 3 (after Task 10)
  - **Blocks**: Task 19
  - **Blocked By**: Task 10

  **References**: Build system in Task 1

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Full build produces all artifacts
    Tool: Bash
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
      3. Assert: dist/hook-handler.js exists
      4. Assert: dist/mcp-server/index.js exists
      5. Assert: dist/rules.json exists
      6. Assert: GEMINI.md exists and is non-empty
    Expected Result: All build artifacts produced
    Failure Indicators: Missing files, build errors, empty output
    Evidence: .sisyphus/evidence/task-15-build.txt
  ```

  **Commit**: YES (groups with Tasks 11-14)
  - Files: `scripts/build.ts`, `package.json` scripts

---

- [ ] 16. Self-compliance audit: extension follows own rules

  **What to do**:
  - Run the extension's own governance analysis on its own source code
  - Fix any violations found (the extension must follow the principles it enforces)
  - Specific things to verify:
    - No `let` variables that should be `const`
    - No `any` types
    - No mutable arrays/objects without `Readonly`
    - No default exports
    - All functions have explicit return types
    - All error handling uses `Result` types (neverthrow)
    - No `console.log` in hook handler (stdout golden rule)
    - All functions ≤15 lines
    - All public functions have JSDoc comments
  - Run `npx tsc --noEmit` with strict settings — must pass zero errors

  **Must NOT do**:
  - Do NOT suppress violations with `@ts-ignore` or `as any`
  - Do NOT skip the self-compliance check — this is a hard requirement

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs all implementation done)
  - **Parallel Group**: Wave 4
  - **Blocks**: F2 (code quality review)
  - **Blocked By**: Tasks 11, 12, 13

  **References**:

  **Pattern References**:
  - `aad-governance/PRINCIPLES.md:1-404` — The exact rules being enforced

  **WHY Each Reference Matters**:
  - The extension must be a living example of governance compliance

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Extension source passes its own governance check
    Tool: Bash
    Steps:
      1. Run: npx tsc --noEmit (with strict tsconfig)
      2. Assert: exit code 0
      3. Run the analyze_governance MCP tool on each src/*.ts file
      4. Assert: zero ENFORCED violations
      5. Run: grep -r "let " src/ (excluding for-loop lets)
      6. Assert: no unnecessary let declarations
      7. Run: grep -r ": any" src/
      8. Assert: zero any type usages
    Expected Result: Extension's own code has zero governance violations
    Failure Indicators: Any let/internals violations, any types, missing return types
    Evidence: .sisyphus/evidence/task-16-self-compliance.txt
  ```

  **Commit**: YES
  - Message: `refactor(plugin): self-compliance audit and fixes`
  - Files: All source files that needed fixes

---

- [ ] 17. Hook error handling + edge cases

  **What to do**:
  - Handle all edge cases in the hook handler:
    - Invalid JSON input → error response to stderr, exit code 0 (don't block)
    - Tool input without `content` or `new_string` field → passthrough (no-op)
    - Unrecognized file extensions (e.g., `.json`, `.md`) → passthrough (only analyze .ts and .py)
    - Analysis timeout (code too large) → passthrough with warning to stderr
    - Analysis error (bug in detector) → log to stderr, passthrough (don't block on our bugs)
    - Very large files → skip analysis with warning (don't hang the developer)
  - Add file extension filtering: only analyze `.ts`, `.tsx`, `.js`, `.jsx`, `.py` files
  - Add configurable file size limit (default: 100KB)
  - Write comprehensive edge case tests

  **Must NOT do**:
  - Do NOT block file writes on our own bugs — always fall back to passthrough
  - Do NOT write to stdout except the JSON response (golden rule)
  - Do NOT hang if analysis takes too long — implement timeout

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Task 18
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 19
  - **Blocked By**: Task 11

  **References**:

  **Pattern References**:
  - `aad-governance/PATTERNS.md:878-900` — Error handling patterns (boundary layer: map exceptions to DomainErrors)

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Edge case tests added to `src/boundary/hook-handler.test.ts`
  - [ ] `npx vitest run` → all pass (including edge cases)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Hook handles invalid JSON gracefully
    Tool: Bash (echo + pipe)
    Steps:
      1. echo "NOT JSON" | node dist/hook-handler.js
      2. Assert: exit code 0 (not 2 — we don't block)
      3. Assert: stderr contains error message
      4. Assert: stdout is empty or valid empty JSON object
    Expected Result: Invalid input doesn't crash, doesn't block writes
    Failure Indicators: Exit code 2 (would block), uncaught exception, non-empty stdout with garbage
    Evidence: .sisyphus/evidence/task-17-invalid-json.txt

  Scenario: Hook skips non-code files
    Tool: Bash (echo + pipe)
    Steps:
      1. Create JSON for write_file with path "README.md" and content "Hello"
      2. Pipe through hook handler
      3. Assert: empty object response (passthrough)
    Expected Result: Non-code files pass through without analysis
    Failure Indicators: Hook attempts to analyze markdown as code
    Evidence: .sisyphus/evidence/task-17-skip-non-code.txt

  Scenario: Hook handles analysis timeout
    Tool: Bash (node + test with artificial 1ms timeout)
    Steps:
      1. Create a large TypeScript file input
      2. Set ANALYSIS_TIMEOUT=1 environment variable
      3. Pipe through hook handler
      4. Assert: passthrough response (no blocking)
      5. Assert: stderr contains timeout warning
    Expected Result: Large files bypass analysis rather than hanging
    Failure Indicators: Hook hangs, or blocks legitimate writes
    Evidence: .sisyphus/evidence/task-17-timeout.txt
  ```

  **Commit**: YES
  - Message: `feat(plugin): hook error handling and edge cases`
  - Files: `src/boundary/hook-handler.ts`, test file

---

- [ ] 18. README + installation instructions

  **What to do**:
  - Create `README.md` with:
    - Extension overview and purpose
    - Installation: `gemini extensions install <repo-url>` or `gemini extensions link .`
    - Configuration: available settings (severity levels, file size limit, timeout)
    - Usage: GEMINI.md context, `/governance:analyze` command, hook behavior
    - List of all governance rules with their enforcement tiers and fixability
    - Contributing guide
  - Create `CONTRIBUTING.md` with:
    - How to add new rules (to the rule schema)
    - How to run tests
    - How to build and link locally

  **Must NOT do**:
  - Do NOT include AI-generated filler or excessive documentation
  - Do NOT add emojis

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES — with Tasks 16, 17
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 15 (needs build commands to document)

  **References**:

  **External References**:
  - Security extension README: https://github.com/gemini-cli-extensions/security

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: README contains installation instructions
    Tool: Bash (grep)
    Steps:
      1. Run: grep -c "gemini extensions" README.md
      2. Assert: count >= 2 (install and link commands)
      3. Run: grep -c "governance:analyze" README.md
      4. Assert: count >= 1
    Expected Result: README has installation and usage documentation
    Failure Indicators: Missing installation steps
    Evidence: .sisyphus/evidence/task-18-readme.txt
  ```

  **Commit**: YES
  - Message: `docs(plugin): add README and contribution guide`
  - Files: `README.md`, `CONTRIBUTING.md`

---

- [ ] 19. Integration test: end-to-end hook flow with sample Gemini output

  **What to do**:
  - Create `tests/integration/` directory
  - Write end-to-end test fixtures that simulate complete Gemini CLI hook flows:
    - Fixture: `let-violation.json` — write_file with `let x = 5` → expect auto-fix to `const`
    - Fixture: `bare-catch-violation.json` — write_file with empty catch → expect deny with reason
    - Fixture: `nested-call-violation.json` — write_file with `f(g(h(x)))` → expect deny with Pipes pillar reference
    - Fixture: `compliant-typescript.json` — write_file with governance-compliant TS → expect passthrough
    - Fixture: `compliant-python.json` — write_file with governance-compliant Python → expect passthrough
    - Fixture: `mixed-violations.json` — write_file with multiple violations → expect appropriate combined response
    - Fixture: `edit-file-patch.json` — edit_file with new_string violation → expect denial of patch
    - Fixture: `non-code-file.json` — write_file for .md/.json file → expect passthrough
  - Write a test runner that pipes each fixture through the compiled hook handler and verifies output
  - Verify exit codes: 0 for passthrough/modify, 2 for deny

  **Must NOT do**:
  - Do NOT use actual Gemini CLI in tests — simulate with JSON fixtures
  - Do NOT skip non-code file tests — passthrough behavior must be verified

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all implementation)
  - **Parallel Group**: Wave 4 (after Tasks 11, 15, 17)
  - **Blocks**: F3 (manual QA)
  - **Blocked By**: Tasks 11, 15, 17

  **References**:

  **Pattern References**:
  - All governance patterns in `aad-governance/PATTERNS.md` — source for test fixture code

  **Acceptance Criteria**:

  **If TDD**:
  - [ ] Integration tests in `tests/integration/`
  - [ ] At least 8 fixture files (1 per scenario above)
  - [ ] `npx vitest run tests/integration/` → all pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: End-to-end auto-fix flow
    Tool: Bash (node pipe)
    Steps:
      1. Pipe let-violation.json through dist/hook-handler.js
      2. Parse stdout JSON
      3. Assert: hookSpecificOutput.tool_input.content contains "const" instead of "let"
      4. Assert: exit code 0
    Expected Result: Auto-fix applied, exit code 0
    Failure Indicators: Content unchanged, wrong exit code, invalid JSON
    Evidence: .sisyphus/evidence/task-19-e2e-autofix.txt

  Scenario: End-to-end denial flow
    Tool: Bash (node pipe)
    Steps:
      1. Pipe bare-catch-violation.json through dist/hook-handler.js
      2. Parse stdout JSON
      3. Assert: decision === "deny"
      4. Assert: reason contains governance pillar reference
      5. Assert: exit code 2
    Expected Result: Denial with reason, exit code 2
    Failure Indicators: No denial, missing reason, wrong exit code
    Evidence: .sisyphus/evidence/task-19-e2e-deny.txt

  Scenario: Compliant code passthrough
    Tool: Bash (node pipe)
    Steps:
      1. Pipe compliant-typescript.json through dist/hook-handler.js
      2. Parse stdout JSON
      3. Assert: empty object {} (passthrough)
      4. Assert: exit code 0
    Expected Result: No modifications to compliant code
    Failure Indicators: False positive violations detected
    Evidence: .sisyphus/evidence/task-19-e2e-compliant.txt
  ```

  **Commit**: YES
  - Message: `test(plugin): end-to-end hook flow integration tests`
  - Files: `tests/integration/` (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep for patterns). For each "Must NOT Have": search for forbidden patterns — reject with file:line if found. Check evidence files. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `vitest run`. Review all changed files for: `any` types, empty catches, console.log in hook handler (golden rule violation), unused imports, commented-out code. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Install extension via `gemini extensions link .`. Run `/governance:analyze` on a test file. Trigger a write_file with `let x = 5` — verify auto-fix to `const x = 5`. Trigger a write_file with bare catch — verify block with reason. Test with compliant code — verify passthrough.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1. Check "Must NOT do" compliance. Detect unaccounted changes. Verify no VS Code extension, no Docker, no fast-check, no tree-sitter.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(plugin): scaffold project structure and rule schema` — Tasks 1-5
- **Wave 2**: `feat(plugin): implement rule detectors and auto-fixers` — Tasks 6-10
- **Wave 3**: `feat(plugin): integrate hook handler, MCP tools, and commands` — Tasks 11-15
- **Wave 4**: `feat(plugin): self-compliance audit and polish` — Tasks 16-19

---

## Success Criteria

### Verification Commands
```bash
npx vitest run                            # Expected: all tests pass
npx tsc --noEmit                          # Expected: zero errors
node dist/hook.js < test/fixtures/let-violation.json  # Expected: auto-fixed output
node dist/hook.js < test/fixtures/bare-catch.json      # Expected: deny with reason
node dist/hook.js < test/fixtures/compliant.json       # Expected: no modification
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Extension loads without errors via `gemini extensions link .`
- [ ] Extension's own code passes its own governance checks