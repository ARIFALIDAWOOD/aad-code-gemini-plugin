import { describe, expect, it } from "vitest";
import { applyFixes } from "#domain/fixers/fixer-engine.js";

describe("applyFixes", () => {
  it("converts let to const", () => {
    const result = applyFixes({
      code: "let x = 5;",
      filePath: "test.ts",
      language: "typescript",
      violations: [
        {
          ruleId: "immutability-no-let",
          severity: "enforced",
          message: "Use const",
          line: 1,
          column: 1,
          snippet: "let x = 5;",
        },
      ],
    });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toContain("const x = 5;");
    }
  });
});
