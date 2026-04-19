import { describe, expect, it } from "vitest";
import { processHook } from "./hook-handler.js";

describe("processHook", () => {
  it("passes through non-write tools", () => {
    const result = processHook(
      { tool_name: "read_file", tool_input: { path: "x.ts" } }
    );
    expect(result).toEqual({});
  });

  it("auto-fixes let for enforced immutability rule", () => {
    const result = processHook(
      {
        tool_name: "write_file",
        tool_input: { path: "sample.ts", content: "let x = 5;" },
      }
    );
    expect(result.hookSpecificOutput?.tool_input.content).toContain("const x = 5;");
  });

  it("denies nested calls for enforced pipes rule", () => {
    const result = processHook(
      {
        tool_name: "write_file",
        tool_input: { path: "sample.ts", content: "const y = f(g(h(x)));" },
      }
    );
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("pipes-no-nested-calls");
  });
});
