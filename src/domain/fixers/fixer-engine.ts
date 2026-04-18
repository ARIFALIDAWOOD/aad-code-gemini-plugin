import { err, ok, type Result } from "neverthrow";
import { domainError, type DomainError } from "#domain/errors.js";
import { getRuleById } from "#domain/rules/rule-registry.js";
import type { Violation } from "#domain/types.js";
import { applyBareCatchComment, applyDefaultExportNamed, applyLetToConst } from "#domain/fixers/typescript-fixers.js";
import { applyBareExceptComment, applyFutureAnnotations, applyMutableDefaultFix } from "#domain/fixers/python-fixers.js";

const assertAllFixable = (violations: ReadonlyArray<Violation>): Result<void, DomainError> => {
  for (const violation of violations) {
    const rule = getRuleById(violation.ruleId);
    if (!rule?.fixable) {
      return err(domainError("fixer-engine", `Rule ${violation.ruleId} is not auto-fixable`));
    }
  }
  return ok(undefined);
};

export const applyFixes = (input: {
  readonly code: string;
  readonly filePath: string;
  readonly language: "typescript" | "python";
  readonly violations: ReadonlyArray<Violation>;
}): Result<string, DomainError> => {
  if (input.violations.length === 0) {
    return ok(input.code);
  }

  const guard = assertAllFixable(input.violations);
  if (guard.isErr()) {
    return err(guard.error);
  }

  let current = input.code;
  const ids = new Set(input.violations.map((v) => v.ruleId));

  if (input.language === "typescript") {
    if (ids.has("immutability-no-let")) {
      const next = applyLetToConst(current, input.filePath);
      if (next.isErr()) {
        return err(next.error);
      }
      current = next.value;
    }
    if (ids.has("railways-no-bare-catch")) {
      const next = applyBareCatchComment(current);
      if (next.isErr()) {
        return err(next.error);
      }
      current = next.value;
    }
    if (ids.has("antipattern-no-default-export")) {
      const next = applyDefaultExportNamed(current);
      if (next.isErr()) {
        return err(next.error);
      }
      current = next.value;
    }
    return ok(current);
  }

  if (ids.has("immutability-mutable-default")) {
    const next = applyMutableDefaultFix(current);
    if (next.isErr()) {
      return err(next.error);
    }
    current = next.value;
  }
  if (ids.has("total-typing-future-annotations")) {
    const next = applyFutureAnnotations(current);
    if (next.isErr()) {
      return err(next.error);
    }
    current = next.value;
  }
  if (ids.has("railways-no-bare-except-python")) {
    const next = applyBareExceptComment(current);
    if (next.isErr()) {
      return err(next.error);
    }
    current = next.value;
  }

  return ok(current);
};
