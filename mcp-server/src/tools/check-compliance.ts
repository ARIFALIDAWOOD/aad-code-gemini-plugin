import { analyzeCodeForRule } from "#domain/engine.js";
import type { DomainError } from "#domain/errors.js";
import { getRuleById } from "#domain/rules/rule-registry.js";
import type { Violation } from "#domain/types.js";
import type { Result } from "neverthrow";

type CompliancePayload = Readonly<{
  compliant: boolean;
  violations?: ReadonlyArray<Violation>;
  suggestedFix?: string;
}>;

export const runCheckComplianceTool = (input: {
  readonly content: string;
  readonly ruleId: string;
  readonly language: "typescript" | "python";
  readonly filePath?: string;
}): Result<CompliancePayload, DomainError> =>
  analyzeCodeForRule({
    code: input.content,
    filePath: input.filePath ?? "snippet.ts",
    language: input.language,
    ruleId: input.ruleId,
  }).map((result) => {
    const compliant = result.violations.length === 0;
    const rule = getRuleById(input.ruleId);
    const suggestedFix = rule?.fixStrategy ? JSON.stringify(rule.fixStrategy) : undefined;
    if (compliant) {
      return { compliant };
    }
    if (suggestedFix === undefined) {
      return { compliant, violations: result.violations };
    }
    return { compliant, violations: result.violations, suggestedFix };
  });
