# Generalize Governance Documents

## TL;DR

> **Quick Summary**: Remove project-specific references (xauusd) from `aad-governance/ARCHITECTURE.md`, relocate general principles from the deleted section to the architecture layer section, and verify no other files are affected.
> 
> **Deliverables**:
> - ARCHITECTURE.md: "Layer Mapping: .aad to Backend" section removed
> - ARCHITECTURE.md: Two general principles relocated and reworded in the 4-layer architecture section
> - All other governance files unchanged
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO — single-file sequential edit
> **Critical Path**: Task 1 → Task 2

---

## Context

### Original Request
The `aad-governance/` directory contains references to a specific project called "xauusd" (specifically `xauusd-dxy-plan/`). These governance documents should be generally applicable and not bound to any specific project.

### Interview Summary
**Key Discussions**:
- User confirmed: keep `.aad` as the governance framework's brand name — only remove project-specific references
- User chose: delete the "Layer Mapping" section entirely (the 4-layer concept is already defined earlier)
- User chose: relocate lines 224-225 general principles to the 4-layer section, reworded to use layer names instead of directory names

**Research Findings**:
- Only 2 files had project-specific references: ARCHITECTURE.md and FRONTIER.md
- FRONTIER.md only references `.aad` (the brand name) — no changes needed
- ARCHITECTURE.md lines 212-226 contain the only project-bound content
- PATTERNS.md uses FastAPI as an illustrative code example — out of scope, no changes needed

### Metis Review
**Identified Gaps** (addressed):
- What replaces the Layer Mapping section? → **Resolved**: Delete entirely
- Should lines 224-225 be preserved? → **Resolved**: Relocate & reword
- Should PATTERNS.md FastAPI examples be generalized? → **Resolved**: No, they're illustrative, not project-specific

---

## Work Objectives

### Core Objective
Make `aad-governance/` documents project-agnostic by removing all references to the `xauusd` project and project-specific technical implementation details.

### Concrete Deliverables
- `aad-governance/ARCHITECTURE.md` with the "Layer Mapping: .aad to Backend" section removed and two principles relocated
- Verification that no other governance files were modified

### Definition of Done
- [x] `grep -ri "xauusd" aad-governance/` returns zero matches
- [x] `grep -n "FastAPI lifespan" aad-governance/ARCHITECTURE.md` returns zero matches
- [x] `git diff aad-governance/PATTERNS.md` shows no changes
- [x] `git diff aad-governance/PRINCIPLES.md` shows no changes
- [x] `git diff aad-governance/VERIFICATION.md` shows no changes
- [x] `git diff aad-governance/reference/FRONTIER.md` shows no changes
- [x] ARCHITECTURE.md reads cleanly — no orphaned headings or broken transitions between Sections 1-8

### Must Have
- All `xauusd`/`xauusd-dxy-plan` references removed
- Project-specific directory mappings removed
- Two general principles (pure core, effects in adapters) preserved in reworded form
- All other governance files untouched

### Must NOT Have (Guardrails)
- Do NOT touch PATTERNS.md — FastAPI there is an illustrative example, not a project binding
- Do NOT touch FRONTIER.md — `.aad` is the framework brand
- Do NOT touch PRINCIPLES.md or VERIFICATION.md — they have no project-specific references
- Do NOT add new content beyond the relocated principles
- Do NOT modify any lines outside the targeted sections in ARCHITECTURE.md

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: N/A (documentation change)
- **Automated tests**: None needed
- **Framework**: N/A

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Sequential Execution

```
Task 1: Delete "Layer Mapping" section (lines 212-226) [quick]
  ↓
Task 2: Relocate & reword two principles into 4-layer section [quick]
  ↓
Task 3: Final verification sweep [quick]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1    | -          | 2      |
| 2    | 1          | 3      |
| 3    | 2          | -      |

### Agent Dispatch Summary

- **Task 1**: `quick`
- **Task 2**: `quick`
- **Task 3**: `quick`

---

## TODOs

- [x] 1. Delete "Layer Mapping: .aad to Backend" section from ARCHITECTURE.md

  **What to do**:
  - In `aad-governance/ARCHITECTURE.md`, delete lines 212-226 (the entire "Layer Mapping: .aad to Backend" section including the heading, introductory paragraph, table, and bullet points)
  - The section starts at `### Layer Mapping: .aad to Backend` (line 212) and ends before `### Architecture Decision Records (ADRs)` (line 228)
  - Ensure clean markdown transition: the code block ending around line 210 should flow directly into the `### Architecture Decision Records (ADRs)` section at what will become the new line after deletion

  **Must NOT do**:
  - Do NOT modify any content before line 212 or after line 226
  - Do NOT modify PATTERNS.md, PRINCIPLES.md, VERIFICATION.md, or FRONTIER.md
  - Do NOT add replacement content for the deleted section

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `aad-governance/ARCHITECTURE.md:212-226` — The exact section to delete. Starts with `### Layer Mapping: .aad to Backend` and ends before `### Architecture Decision Records (ADRs)`.

  **API/Type References**:
  - N/A — documentation change only

  **Test References**:
  - N/A — no code tests needed

  **External References**:
  - N/A

  **WHY Each Reference Matters**:
  - Lines 212-226: Contains the only project-specific references (`xauusd-dxy-plan/`, project directory mappings, FastAPI lifespan, MCP server). Must be removed to achieve project-agnosticism.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: No project-specific references remain
    Tool: Bash (grep)
    Preconditions: The edit has been applied to ARCHITECTURE.md
    Steps:
      1. Run: grep -ri "xauusd" aad-governance/
      2. Assert: zero matches returned
    Expected Result: grep returns exit code 1 (no matches found)
    Failure Indicators: Any line output containing "xauusd"
    Evidence: .sisyphus/evidence/task-1-no-xauusd.txt

  Scenario: Section cleanly removed without orphaned content
    Tool: Bash (grep + Read)
    Preconditions: The edit has been applied
    Steps:
      1. Run: grep -n "Layer Mapping" aad-governance/ARCHITECTURE.md
      2. Assert: zero matches
      3. Run: grep -n "xauusd" aad-governance/ARCHITECTURE.md
      4. Assert: zero matches
      5. Read ARCHITECTURE.md around the deletion point (lines around 210-230) to verify clean transition
    Expected Result: No "Layer Mapping" heading, no project-specific references, markdown structure intact
    Failure Indicators: Orphaned bullet points, broken heading levels, stray text fragments
    Evidence: .sisyphus/evidence/task-1-clean-structure.txt

  Scenario: Other governance files unchanged
    Tool: Bash (git diff)
    Preconditions: Edit applied, git tracking changes
    Steps:
      1. Run: git diff aad-governance/PATTERNS.md
      2. Assert: no diff output
      3. Run: git diff aad-governance/PRINCIPLES.md
      4. Assert: no diff output
      5. Run: git diff aad-governance/VERIFICATION.md
      6. Assert: no diff output
      7. Run: git diff aad-governance/reference/FRONTIER.md
      8. Assert: no diff output
    Expected Result: All four commands show empty diff (no changes to those files)
    Failure Indicators: Any diff output in any of the four files
    Evidence: .sisyphus/evidence/task-1-other-files-unchanged.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `docs(governance): remove project-specific layer mapping from architecture`
  - Files: `aad-governance/ARCHITECTURE.md`
  - Pre-commit: N/A (documentation only)

---

- [x] 2. Relocate & reword two general principles into the 4-layer architecture section

  **What to do**:
  - The deleted section contained two general principles (from former lines 224-225):
    - "Pure core has no I/O — `core/` never imports from `services/` or `adapters/`."
    - "Effects live in adapters and are invoked via port protocols."
  - Relocate these principles to the "4-Layer Architecture" section (around lines 30-119), specifically after the "Dependency Rules" sub-section (which ends around line 85)
  - Reword them to reference **layer names** (Domain, Infrastructure, Boundary) instead of **directory names** (core/, adapters/):
    - "**Domain layer is pure** — no external imports, no I/O, no framework dependencies. Business logic has zero side effects."
    - "**Side effects live in Infrastructure and Boundary** — all I/O, database access, and external calls are invoked via port protocols defined in the Domain."
  - These reworded principles extend the existing "Dependency Rules" list at lines 82-85

  **Must NOT do**:
  - Do NOT use project-specific directory names like `core/`, `services/`, `adapters/`
  - Do NOT add new information beyond relocating the two principles
  - Do NOT modify any other sections

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1's deletion)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `aad-governance/ARCHITECTURE.md:82-85` — The "Dependency Rules" list where the two principles should be appended. Currently has 3 bullet points about Domain purity, inner/outer layer imports, and Infrastructure independence.

  **WHY Each Reference Matters**:
  - Lines 82-85: This is the natural home for the two relocated principles — they're about dependency rules between layers, which is exactly what this list covers.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Principles relocated and reworded correctly
    Tool: Bash (grep) + Read
    Preconditions: Task 1 deletion completed, Task 2 edit applied
    Steps:
      1. Run: grep -n "Domain layer is pure" aad-governance/ARCHITECTURE.md
      2. Assert: exactly 1 match found
      3. Run: grep -n "Side effects live in Infrastructure" aad-governance/ARCHITECTURE.md
      4. Assert: exactly 1 match found
      5. Read the Dependency Rules section to verify both principles are present and use layer names (not directory names)
    Expected Result: Two new bullet points under "Dependency Rules" referencing layer names (Domain, Infrastructure, Boundary) — not directory names (core/, adapters/)
    Failure Indicators: References to `core/`, `services/`, `adapters/`, or any project-specific path names
    Evidence: .sisyphus/evidence/task-2-relocated-principles.txt

  Scenario: No project-specific directory names in new principles
    Tool: Bash (grep)
    Preconditions: Edit applied
    Steps:
      1. Run: grep -n "core/" aad-governance/ARCHITECTURE.md
      2. Assert: zero matches referencing project-specific directories (code examples inside code blocks are acceptable)
      3. Run: grep -n "xauusd" aad-governance/ARCHITECTURE.md
      4. Assert: zero matches
    Expected Result: No project-specific directory references outside of code examples
    Failure Indicators: Any occurrence of `core/`, `services/`, or `adapters/` as project directory references (not code examples)
    Evidence: .sisyphus/evidence/task-2-no-project-refs.txt
  ```

  **Commit**: YES (combined with Task 1)
  - Message: `docs(governance): remove project-specific references and relocate general principles`
  - Files: `aad-governance/ARCHITECTURE.md`
  - Pre-commit: N/A (documentation only)

---

- [x] 3. Final verification sweep

  **What to do**:
  - Run comprehensive grep across all governance files to confirm zero project-specific references remain
  - Read the modified section of ARCHITECTURE.md to verify clean markdown structure
  - Verify the document reads correctly end-to-end with no orphaned content

  **Must NOT do**:
  - Do NOT make any additional edits — this is verification only

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (final verification after all edits)
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `aad-governance/ARCHITECTURE.md` — Full file to verify structural integrity

  **WHY Each Reference Matters**:
  - Need to verify the entire file reads correctly after both edits, with no broken sections or orphaned content.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Complete project-agnosticism verified
    Tool: Bash (grep)
    Preconditions: All edits completed
    Steps:
      1. Run: grep -ri "xauusd" aad-governance/
      2. Assert: zero matches
      3. Run: grep -ri "xauusd-dxy-plan" aad-governance/
      4. Assert: zero matches
      5. Run: grep -n "FastAPI lifespan" aad-governance/ARCHITECTURE.md
      6. Assert: zero matches (FastAPI in PATTERNS.md code examples is acceptable)
      7. Run: grep -n "Layer Mapping" aad-governance/ARCHITECTURE.md
      8. Assert: zero matches (section removed)
      9. Run: grep -n "MCP server" aad-governance/ARCHITECTURE.md
      10. Assert: zero matches (project-specific reference removed)
    Expected Result: All grep commands return zero matches
    Failure Indicators: Any match on any of the grep patterns
    Evidence: .sisyphus/evidence/task-3-no-project-refs.txt

  Scenario: Document structural integrity
    Tool: Read
    Preconditions: All edits completed
    Steps:
      1. Read ARCHITECTURE.md sections around the edit points (lines 80-90 and the transition area around former section 5)
      2. Verify: Dependency Rules list includes the two new relocated principles
      3. Verify: No orphaned bullet points or broken headings between Section 1 (4-Layer Architecture) and Section 2 (Concurrency Model)
      4. Verify: Clean transition from Domain Protocols section to Architecture Decision Records section
    Expected Result: Clean markdown, no broken structure, principles properly placed
    Failure Indicators: Orphaned content, broken heading levels, missing section transitions
    Evidence: .sisyphus/evidence/task-3-structure-integrity.txt

  Scenario: Other files remain completely unchanged
    Tool: Bash (git diff)
    Preconditions: All edits completed
    Steps:
      1. Run: git diff --stat aad-governance/
      2. Assert: Only ARCHITECTURE.md shows changes
      3. Run: git diff aad-governance/PATTERNS.md aad-governance/PRINCIPLES.md aad-governance/VERIFICATION.md aad-governance/reference/FRONTIER.md
      4. Assert: Empty output (no changes to these files)
    Expected Result: Only ARCHITECTURE.md modified, all other files unchanged
    Failure Indicators: Any diff output for PATTERNS.md, PRINCIPLES.md, VERIFICATION.md, or FRONTIER.md
    Evidence: .sisyphus/evidence/task-3-unchanged-files.txt
  ```

  **Commit**: NO ( verification only, no code changes)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep for patterns). For each "Must NOT Have": search for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [3/3] | Must NOT Have [5/5] | Tasks [3/3] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Review the diff of ARCHITECTURE.md. Check: markdown formatting intact, no broken links, no orphaned headings, no typos introduced. Verify the relocated principles use layer names (not directory names).
  Output: `Structure [PASS/FAIL] | Formatting [PASS/FAIL] | Content [PASS/FAIL] | VERDICT`

- [x] F3. **Content Accuracy Review** — `unspecified-high`
  Read the full ARCHITECTURE.md. Verify: all 8 sections flow correctly, no duplicate content, the two new dependency rules are consistent with existing rules, no project-specific references remain anywhere.
  Output: `Sections [8/8] | Consistency [PASS/FAIL] | No Project Refs [PASS/FAIL] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  Verify: only ARCHITECTURE.md was modified. exactly the Layer Mapping section was deleted. exactly two principles were relocated and reworded. no other content was added, removed, or modified. no scope creep.
  Output: `Files Changed [1/1] | Deletion Accurate [PASS/FAIL] | Relocation Accurate [PASS/FAIL] | No Creep [PASS/FAIL] | VERDICT`

---

## Commit Strategy

- **1**: `docs(governance): remove project-specific references and relocate general principles` - `aad-governance/ARCHITECTURE.md`

---

## Success Criteria

### Verification Commands
```bash
grep -ri "xauusd" aad-governance/          # Expected: zero matches
grep -n "FastAPI lifespan" aad-governance/ARCHITECTURE.md  # Expected: zero matches
grep -n "Layer Mapping" aad-governance/ARCHITECTURE.md     # Expected: zero matches (section removed)
grep -n "MCP server" aad-governance/ARCHITECTURE.md         # Expected: zero matches
git diff --stat aad-governance/                            # Expected: only ARCHITECTURE.md changed
```

### Final Checklist
- [x] All "Must Have" criteria met
- [x] All "Must NOT Have" criteria met (no scope creep)
- [x] ARCHITECTURE.md reads cleanly with proper section transitions
- [x] Two relocated principles use layer names (not project directory names)
- [x] No other governance files were modified