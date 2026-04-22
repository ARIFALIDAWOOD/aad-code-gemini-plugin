import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..");
const hookBinary = join(root, "dist", "hook-handler.js");

const runHook = (stdinJson: string): { stdout: string; status: number | null } => {
  const result = spawnSync(process.execPath, [hookBinary], {
    input: stdinJson,
    encoding: "utf8",
  });
  return { stdout: (result.stdout ?? "").trim(), status: result.status };
};

describe("hook-handler integration", () => {
  it.skipIf(!existsSync(hookBinary))("auto-fixes let to const", () => {
    const payload = JSON.stringify({
      tool_name: "write_file",
      tool_input: { path: "sample.ts", content: "let x = 5;" },
    });
    const { stdout, status } = runHook(payload);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as { hookSpecificOutput?: { tool_input?: { content?: string } } };
    expect(parsed.hookSpecificOutput?.tool_input?.content).toContain("const x = 5;");
  });

  it.skipIf(!existsSync(hookBinary))("denies nested calls", () => {
    const payload = JSON.stringify({
      tool_name: "write_file",
      tool_input: { path: "sample.ts", content: "const y = f(g(h()));" },
    });
    const { stdout, status } = runHook(payload);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as { decision?: string };
    expect(parsed.decision).toBe("deny");
  });

  it.skipIf(!existsSync(hookBinary))("passthrough for markdown paths", () => {
    const payload = JSON.stringify({
      tool_name: "write_file",
      tool_input: { path: "README.md", content: "Hello" },
    });
    const { stdout, status } = runHook(payload);
    expect(status).toBe(0);
    expect(stdout).toBe("{}");
  });
});

describe("integration fixtures", () => {
  it.skipIf(!existsSync(join(root, "tests", "integration", "fixtures", "let-violation.json")))(
    "fixture drives write_file payload",
    () => {
      const raw = readFileSync(join(root, "tests", "integration", "fixtures", "let-violation.json"), "utf8");
      expect(JSON.parse(raw) as { tool_name: string }).toHaveProperty("tool_name", "write_file");
    },
  );
});
