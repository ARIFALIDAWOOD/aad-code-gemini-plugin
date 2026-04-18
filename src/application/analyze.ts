import type { Result } from "neverthrow";
import type { DomainError } from "#domain/errors.js";
import { analyzeCode } from "#domain/engine.js";
import type { AnalysisResult } from "#domain/types.js";

export const runAnalysis = (input: {
  readonly code: string;
  readonly filePath: string;
  readonly language: "typescript" | "python";
}): Result<AnalysisResult, DomainError> => analyzeCode(input);
