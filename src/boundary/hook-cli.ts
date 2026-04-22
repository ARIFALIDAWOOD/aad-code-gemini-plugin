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
    const response = processHook(parsed);
    const outJson = JSON.stringify(response);
    const output = outJson + "\n";
    process.stdout.write(output);
  } catch (error) {
    logError(error);
  }
};

async function main(): Promise<void> {
  try {
    const raw = await readStdin();
    handleHook(raw);
  } catch (error) {
    logError(error);
  }
}

main();
