import { analyzeCode } from "#domain/engine.js";
import type { DomainError } from "#domain/errors.js";
import { getRuleById } from "#domain/rules/rule-registry.js";
import type { AnalysisResult, Violation } from "#domain/types.js";
import type { Result } from "neverthrow";

const summarize = (violations: ReadonlyArray<Violation>) => {
  let enforced = 0;
  let recommended = 0;
  let fixable = 0;
  for (const v of violations) {
    if (v.severity === "enforced") {
      enforced += 1;
    }
    if (v.severity === "recommended") {
      recommended += 1;
    }
    const rule = getRuleById(v.ruleId);
    if (rule?.fixable) {
      fixable += 1;
    }
  }
  return {
    total: violations.length,
    enforced,
    recommended,
    fixable,
  };
};

export const runAnalyzeGovernanceTool = (input: {
  readonly content: string;
  readonly language: "typescript" | "python";
  readonly filePath?: string;
}): Result<
  Readonly<{
    violations: ReadonlyArray<Violation>;
    summary: ReturnType<typeof summarize>;
  }>,
  DomainError
> =>
  analyzeCode({
    code: input.content,
    filePath: input.filePath ?? "snippet.ts",
    language: input.language,
  }).map((result: AnalysisResult) => ({
    violations: result.violations,
    summary: summarize(result.violations),
  }));
