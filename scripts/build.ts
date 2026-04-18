import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import { generateGeminiMarkdown } from "../src/application/generate-gemini-md.js";
import { ALL_GOVERNANCE_RULES } from "../src/domain/rules/rule-registry.js";

const getRootDir = (): string => {
  const url = import.meta.url;
  const path = fileURLToPath(url);
  const dir = dirname(path);
  const root = join(dir, "..");
  return root;
};

const rootDir = getRootDir();
const args = process.argv;
const rulesOnly = args.includes("--rules-only");

const buildMcp = async (shared: esbuild.BuildOptions): Promise<void> => {
  const entry = join(rootDir, "mcp-server", "src", "index.ts");
  const out = join(rootDir, "mcp-server", "dist", "index.js");
  const config: esbuild.BuildOptions = {
    ...shared,
    entryPoints: [entry],
    outfile: out,
    external: ["typescript"],
  };
  await esbuild.build(config);
};

const buildHook = async (shared: esbuild.BuildOptions): Promise<void> => {
  const entry = join(rootDir, "src", "boundary", "hook-cli.ts");
  const out = join(rootDir, "dist", "hook-handler.js");
  const config: esbuild.BuildOptions = {
    ...shared,
    entryPoints: [entry],
    outfile: out,
    external: ["typescript"],
  };
  await esbuild.build(config);
};

const run = async (): Promise<void> => {
  const distDir = join(rootDir, "dist");
  mkdirSync(distDir, { recursive: true });

  const mcpDistDir = join(rootDir, "mcp-server", "dist");
  mkdirSync(mcpDistDir, { recursive: true });

  const rulesPath = join(rootDir, "dist", "rules.json");
  const rulesJson = JSON.stringify(ALL_GOVERNANCE_RULES, null, 2);
  const rulesContent = `${rulesJson}\n`;
  writeFileSync(rulesPath, rulesContent, "utf8");

  if (rulesOnly) {
    return;
  }

  const geminiPath = join(rootDir, "GEMINI.md");
  const geminiMd = generateGeminiMarkdown();
  const geminiContent = `${geminiMd}\n`;
  writeFileSync(geminiPath, geminiContent, "utf8");

  const domainAlias = join(rootDir, "src", "domain");
  const appAlias = join(rootDir, "src", "application");
  const infraAlias = join(rootDir, "src", "infrastructure");
  const boundAlias = join(rootDir, "src", "boundary");

  const shared: esbuild.BuildOptions = {
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    sourcemap: true,
    logLevel: "info",
    alias: {
      "#domain": domainAlias,
      "#application": appAlias,
      "#infrastructure": infraAlias,
      "#boundary": boundAlias,
    },
  };

  await buildHook(shared);
  await buildMcp(shared);
};

const handleError = (error: unknown) => {
  const isErr = error instanceof Error;
  const message = isErr ? error.message : "build failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
};

run().catch(handleError);
