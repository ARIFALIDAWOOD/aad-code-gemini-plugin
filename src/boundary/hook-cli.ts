import { processHook } from "./hook-handler";
import type { HookInput } from "../domain/types";

const readStdin = async (): Promise<string> => {
  const chunks = { content: "" };
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    const text = chunk as string;
    chunks.content += text;
  }
  const result = chunks.content;
  return result;
};

const logError = (error: unknown): void => {
  const errStr = String(error);
  const msg = `[governance-hook] ERROR: ${errStr}\n`;
  process.stderr.write(msg);
  process.exit(1);
};

const handleHook = (raw: string): void => {
  const trimmed = raw.trim();
  const isEmpty = !trimmed;
  if (isEmpty) {
    process.stderr.write("[governance-hook] ERROR: empty stdin\n");
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(raw) as HookInput;
    const toolName = parsed.tool_name;
    const toolMsg = `[governance-hook] tool_name=${toolName}\n`;
    process.stderr.write(toolMsg);

    const response = processHook(parsed);
    const decision = response.decision ?? "allow";
    const decisionMsg = `[governance-hook] decision=${decision}\n`;
    process.stderr.write(decisionMsg);

    const outJson = JSON.stringify(response);
    const output = outJson + "\n";
    process.stdout.write(output);
  } catch (error) {
    logError(error);
  }
};

async function main(): Promise<void> {
  const raw = await readStdin();
  const rawLen = raw.length;
  const msg = `[governance-hook] received ${rawLen} bytes\n`;
  process.stderr.write(msg);
  handleHook(raw);
}

main();
