import { describe, expect, it } from "vitest";
import { detectTypeScriptViolations } from "#domain/rules/typescript-rules.js";

describe("detectTypeScriptViolations", () => {
  it("detects immutability-no-let", () => {
    const result = detectTypeScriptViolations("let x = 5;", "test.ts");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.some((v) => v.ruleId === "immutability-no-let")).toBe(true);
    }
  });

  it("allows let inside for-loop initializer", () => {
    const result = detectTypeScriptViolations("for (let i = 0; i < 1; i++) { void i; }", "test.ts");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.some((v) => v.ruleId === "immutability-no-let")).toBe(false);
    }
  });

  it("detects railways-no-bare-catch", () => {
    const result = detectTypeScriptViolations("try { x(); } catch (e) { }", "test.ts");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.some((v) => v.ruleId === "railways-no-bare-catch")).toBe(true);
    }
  });

  it("detects total-typing-no-any", () => {
    const result = detectTypeScriptViolations("const x: any = 1;", "test.ts");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.some((v) => v.ruleId === "total-typing-no-any")).toBe(true);
    }
  });
});
