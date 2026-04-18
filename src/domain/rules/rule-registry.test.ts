import { describe, expect, it } from "vitest";
import { classifyViolation } from "#domain/rules/rule-registry.js";

describe("classifyViolation", () => {
  it("classifies enforced fixable as auto-fix", () => {
    const action = classifyViolation({
      ruleId: "immutability-no-let",
      severity: "enforced",
      message: "Use const",
      line: 1,
      column: 1,
      snippet: "let x = 1",
    });
    expect(action.type).toBe("auto-fix");
  });

  it("classifies enforced unfixable as block", () => {
    const action = classifyViolation({
      ruleId: "pipes-no-nested-calls",
      severity: "enforced",
      message: "Nested calls",
      line: 1,
      column: 1,
      snippet: "f(g())",
    });
    expect(action.type).toBe("block");
  });
});
