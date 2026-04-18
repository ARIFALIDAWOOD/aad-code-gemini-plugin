import { type Result } from "neverthrow";
import { type DomainError } from "#domain/errors.js";
import { type AnalysisResult } from "#domain/types.js";
import { detectTypeScriptViolations } from "#domain/rules/typescript-rules.js";
import { detectPythonViolations } from "#domain/rules/python-rules.js";

export const analyzeCode = (input: {
  readonly code: string;
  readonly filePath: string;
  readonly language: "typescript" | "python";
}): Result<AnalysisResult, DomainError> => {
  const code = input.code;
  const filePath = input.filePath;
  const language = input.language;

  const getViolations = () => {
    if (language === "typescript") {
      return detectTypeScriptViolations(code, filePath);
    }
    return detectPythonViolations(code, filePath);
  };

  const violationsResult = getViolations();

  const result = violationsResult.map((violations) => {
    const analysis: AnalysisResult = {
      violations,
      filePath,
      language,
    };
    return analysis;
  });

  return result;
};

export const analyzeCodeForRule = (input: {
  readonly code: string;
  readonly filePath: string;
  readonly language: "typescript" | "python";
  readonly ruleId: string;
}): Result<AnalysisResult, DomainError> => {
  const analysisResult = analyzeCode(input);
  const targetRuleId = input.ruleId;

  const mapper = (result: AnalysisResult) => {
    const vils = result.violations;
    const isTargetRule = (v: { ruleId: string }): boolean => v.ruleId === targetRuleId;
    const filtered = vils.filter(isTargetRule);
    const updated: AnalysisResult = {
      ...result,
      violations: filtered,
    };
    return updated;
  };

  const finalResult = analysisResult.map(mapper);
  return finalResult;
};
