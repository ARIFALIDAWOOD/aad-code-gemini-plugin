import { ok, type Result } from "neverthrow";
import type { DomainError } from "#domain/errors.js";

export const applyMutableDefaultFix = (code: string): Result<string, DomainError> => {
  let updated = code;
  updated = updated.replace(
    /def\s+(\w+)\s*\(([^)]*?)\b(\w+)\s*=\s*\[\s*\]\s*\)/g,
    "def $1($2$3=None):\n    $3 = $3 or []",
  );
  updated = updated.replace(
    /def\s+(\w+)\s*\(([^)]*?)\b(\w+)\s*=\s*\{\s*\}\s*\)/g,
    "def $1($2$3=None):\n    $3 = $3 or {}",
  );
  return ok(updated);
};

export const applyFutureAnnotations = (code: string): Result<string, DomainError> => {
  if (code.includes("from __future__ import annotations")) {
    return ok(code);
  }
  return ok(`from __future__ import annotations\n\n${code}`);
};

export const applyBareExceptComment = (code: string): Result<string, DomainError> => {
  const updated = code
    .replace(/except\s*:\s*pass/g, "except Exception as error:  # TODO: narrow exception type\n    raise error")
    .replace(
      /except\s+Exception\s*:\s*pass/g,
      "except Exception as error:  # TODO: narrow exception type\n    raise error",
    );
  return ok(updated);
};
