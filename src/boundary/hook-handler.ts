import { runAnalysis } from "../application/analyze";
import type { HookInput, HookOutput } from "../domain/types";

const getLanguage = (filePath: string): "typescript" | "python" | null => {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript";
  if (filePath.endsWith(".py")) return "python";
  return null;
};

const extractPathAndContent = (
  toolInput: Record<string, unknown>,
): { path: string; content: string } | null => {
  const path =
    typeof toolInput["path"] === "string" ? toolInput["path"] :
    typeof toolInput["file_path"] === "string" ? toolInput["file_path"] : null;

  const content =
    typeof toolInput["content"] === "string" ? toolInput["content"] :
    typeof toolInput["new_string"] === "string" ? toolInput["new_string"] : null;

  if (!path || !content) return null;
  return { path, content };
};

export const processHook = (input: HookInput): HookOutput => {
  const file = extractPathAndContent(input.tool_input);
  if (!file) return {};

  const language = getLanguage(file.path);
  if (!language) return {};

  const result = runAnalysis({ code: file.content, filePath: file.path, language });
  if (result.isErr()) return {};

  const enforced = result.value.violations.filter((v) => v.severity === "enforced");
  if (enforced.length === 0) return {};

  const formatViolation = (v: { ruleId: string; line: number; message: string }): string => {
    const lineStr = String(v.line);
    const ruleId = v.ruleId;
    const msg = v.message;
    const formatted = `[${ruleId}] line ${lineStr}: ${msg}`;
    return formatted;
  };

  const reasonParts = enforced.map(formatViolation);
  const reasonStr = reasonParts.join("\n");
  const finalReason = `Governance violations found:\n${reasonStr}`;

  return { decision: "deny", reason: finalReason };
};
