import { describe, expect, it } from "vitest";
import { analyzeCode } from "#domain/engine.js";
import { processHook } from "./hook-handler.js";

describe("processHook", () => {
  it("passes through non-write tools", () => {
    const result = processHook(
      { tool_name: "read_file", tool_input: { path: "x.ts" } },
      { analyze: analyzeCode, maxBytes: 102400 },
    );
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.output).toEqual({});
    }
  });

  it("auto-fixes let to const for write_file", () => {
    const result = processHook(
      {
        tool_name: "write_file",
        tool_input: { path: "sample.ts", content: "let x = 5;" },
      },
      { analyze: analyzeCode, maxBytes: 102400 },
    );
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.output.hookSpecificOutput?.tool_input.content).toContain("const x = 5;");
    }
  });

  it("denies nested calls for enforced pipes rule", () => {
    const result = processHook(
      {
        tool_name: "write_file",
        tool_input: { path: "sample.ts", content: "const y = f(g(h(x)));" },
      },
      { analyze: analyzeCode, maxBytes: 102400 },
    );
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.output.decision).toBe("deny");
      expect(result.value.exitCode).toBe(2);
    }
  });
});
