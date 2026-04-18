import { ok, type Result } from "neverthrow";
import type { DomainError } from "#domain/errors.js";
import type { GovernanceRule, Violation } from "#domain/types.js";

const baseExamples = {
  bad: "example",
  good: "example",
  explanation: "Governance alignment",
} as const;

export const PYTHON_RULE_DEFINITIONS: ReadonlyArray<GovernanceRule> = [
  {
    id: "immutability-mutable-default",
    pillar: "immutability",
    tier: "enforced",
    language: "python",
    title: "No mutable default arguments",
    description: "Use None sentinels for mutable defaults",
    detectionStrategy: "regex",
    fixable: true,
    fixStrategy: { kind: "prepend-statement", statement: "x = x or []" },
    patterns: [{ id: "mutable-default", description: "def f(x=[])" }],
    examples: baseExamples,
  },
  {
    id: "railways-no-bare-except-python",
    pillar: "railways",
    tier: "enforced",
    language: "python",
    title: "No bare except",
    description: "Avoid swallowing all exceptions",
    detectionStrategy: "regex",
    fixable: true,
    fixStrategy: { kind: "prepend-statement", statement: "raise" },
    patterns: [{ id: "bare-except", description: "except: pass" }],
    examples: baseExamples,
  },
  {
    id: "total-typing-no-any-python",
    pillar: "totalTyping",
    tier: "enforced",
    language: "python",
    title: "No typing.Any",
    description: "Disallow Any annotations",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "any", description: "Any" }],
    examples: baseExamples,
  },
  {
    id: "total-typing-future-annotations",
    pillar: "totalTyping",
    tier: "recommended",
    language: "python",
    title: "Future annotations",
    description: "Prefer postponed evaluation of annotations",
    detectionStrategy: "regex",
    fixable: true,
    fixStrategy: { kind: "prepend-statement", statement: "from __future__ import annotations" },
    patterns: [{ id: "future", description: "missing future import" }],
    examples: baseExamples,
  },
  {
    id: "antipattern-no-from-import-star",
    pillar: "immutability",
    tier: "enforced",
    language: "python",
    title: "No star imports",
    description: "from module import * is forbidden",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "import-star", description: "import *" }],
    examples: baseExamples,
  },
  {
    id: "antipattern-no-global-mutable",
    pillar: "pureFunctions",
    tier: "enforced",
    language: "python",
    title: "No global",
    description: "global keyword is discouraged",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "global", description: "global" }],
    examples: baseExamples,
  },
  {
    id: "pipes-no-nested-calls-python",
    pillar: "pipes",
    tier: "enforced",
    language: "python",
    title: "Avoid nested calls",
    description: "Prefer intermediate variables",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "nested", description: "nested calls" }],
    examples: baseExamples,
  },
];

type RegexHit = Readonly<{
  ruleId: string;
  tier: Violation["severity"];
  message: string;
  pattern: RegExp;
}>;

const regexHits: ReadonlyArray<RegexHit> = [
  {
    ruleId: "immutability-mutable-default",
    tier: "enforced",
    message: "Mutable default arguments are forbidden",
    pattern: /def\s+\w+\s*\([^)]*=\s*(\[\s*\]|\{\s*\})/g,
  },
  {
    ruleId: "railways-no-bare-except-python",
    tier: "enforced",
    message: "Bare except handlers are forbidden",
    pattern: /except\s*:\s*pass|except\s+Exception\s*:\s*pass/g,
  },
  {
    ruleId: "total-typing-no-any-python",
    tier: "enforced",
    message: "typing.Any is forbidden",
    pattern: /\bAny\b/g,
  },
  {
    ruleId: "antipattern-no-from-import-star",
    tier: "enforced",
    message: "Star imports are forbidden",
    pattern: /from\s+\S+\s+import\s+\*/g,
  },
  {
    ruleId: "antipattern-no-global-mutable",
    tier: "enforced",
    message: "global keyword is discouraged",
    pattern: /^\s*global\s+\w+/gm,
  },
  {
    ruleId: "pipes-no-nested-calls-python",
    tier: "enforced",
    message: "Nested calls should be flattened (Pipes pillar)",
    pattern: /\w+\s*\(\s*\w+\s*\([^)]+\)\s*\)/g,
  },
];

const lineFromIndex = (code: string, index: number): number => {
  const prefix = code.slice(0, index);
  const parts = prefix.split("\n");
  const count = parts.length;
  return count;
};

const getFutureViolation = (code: string, filePath: string): readonly Violation[] => {
  const futureImport = "from __future__ import annotations";
  const hasFuture = code.includes(futureImport);
  if (hasFuture) return [];

  const commentRegex = /^\s*#[^\n]*\n/gm;
  const empty = "";
  const stripped = code.replace(commentRegex, empty);
  const hasDef = stripped.includes("def ");
  const hasClass = stripped.includes("class ");
  const needsFuture = hasDef || hasClass;

  if (needsFuture) {
    const v: Violation = {
      ruleId: "total-typing-future-annotations",
      severity: "recommended",
      message: "Add from __future__ import annotations for forward-safe typing",
      line: 1,
      column: 1,
      snippet: filePath,
    };
    return [v];
  }
  return [];
};

const processRegexHit = (code: string, hit: RegexHit): readonly Violation[] => {
  const matches = [...code.matchAll(hit.pattern)];
  const toViolation = (match: RegExpMatchArray): Violation => {
    const index = match.index ?? 0;
    const line = lineFromIndex(code, index);
    const rawSnippet = match[0];
    const snippet = rawSnippet.slice(0, 120);
    const result: Violation = {
      ruleId: hit.ruleId,
      severity: hit.tier,
      message: hit.message,
      line,
      column: 1,
      snippet,
    };
    return result;
  };
  const violations = matches.map(toViolation);
  return violations;
};

export const detectPythonViolations = (
  code: string,
  filePath: string,
): Result<ReadonlyArray<Violation>, DomainError> => {
  const accumulateViolations = (acc: readonly Violation[], hit: RegexHit): readonly Violation[] => {
    const violations = processRegexHit(code, hit);
    const next = [...acc, ...violations];
    return next;
  };

  const regexViolations = regexHits.reduce(accumulateViolations, []);
  const futureViolations = getFutureViolation(code, filePath);
  const allViolations = [...regexViolations, ...futureViolations];
  const result = ok(allViolations);
  return result;
};
