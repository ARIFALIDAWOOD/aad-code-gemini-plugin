import { describe, expect, it } from "vitest";
import { detectPythonViolations } from "#domain/rules/python-rules.js";

describe("detectPythonViolations", () => {
  it("detects immutability-mutable-default", () => {
    const result = detectPythonViolations("def f(x=[]): pass", "test.py");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.some((v) => v.ruleId === "immutability-mutable-default")).toBe(true);
    }
  });

  it("detects railways-no-bare-except-python", () => {
    const result = detectPythonViolations("try:\n  x()\nexcept Exception:\n  pass", "test.py");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.some((v) => v.ruleId === "railways-no-bare-except-python")).toBe(true);
    }
  });
});
