import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { processHook } from "./hook-handler";
import type { HookInput } from "../domain/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = ".omg/logs";
const LOG_FILE = path.join(LOG_DIR, "governance.log");

const ensureLogDir = (): void => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

const writeLog = (message: string): void => {
  try {
    ensureLogDir();
    const timestamp = new Date().toISOString();
    const cwd = process.cwd();
    const dir = __dirname;
    const entry = `[${timestamp}] [CWD: ${cwd}] [DIR: ${dir}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, entry, "utf8");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[governance-hook] Failed to write to log: ${errorMsg}\n`);
  }
};

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
  const errStr = error instanceof Error ? error.stack || error.message : String(error);
  const msg = `[governance-hook] ERROR: ${errStr}\n`;
  writeLog(`CRASH: ${errStr}`);
  process.stderr.write(msg);
  process.exit(1);
};

const handleHook = (raw: string): void => {
  const trimmed = raw.trim();
  const isEmpty = !trimmed;
  
  const snippet = trimmed.slice(0, 500);
  const inputMsg = `INPUT RECEIVED: ${snippet}`;
  writeLog(inputMsg);

  if (isEmpty) {
    const msg = "[governance-hook] ERROR: empty stdin";
    writeLog(msg);
    process.stderr.write(msg + "\n");
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(raw) as HookInput;
    const response = processHook(parsed);
    const outJson = JSON.stringify(response);
    
    writeLog(`OUTPUT SENT: ${outJson}`);
    
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
