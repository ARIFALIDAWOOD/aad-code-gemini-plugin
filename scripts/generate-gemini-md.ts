import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateGeminiMarkdown } from "../src/application/generate-gemini-md.js";

const getRootDir = (): string => {
  const url = import.meta.url;
  const path = fileURLToPath(url);
  const dir = dirname(path);
  const root = join(dir, "..");
  return root;
};

const rootDir = getRootDir();
const target = join(rootDir, "GEMINI.md");
const targetDir = dirname(target);

mkdirSync(targetDir, { recursive: true });

const geminiMd = generateGeminiMarkdown();
const content = `${geminiMd}\n`;
writeFileSync(target, content, "utf8");
