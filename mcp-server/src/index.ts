import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runAnalyzeGovernanceTool } from "./tools/analyze-governance.js";
import { runCheckComplianceTool } from "./tools/check-compliance.js";

const languageEnum = z.enum(["typescript", "python"]);
const contentSchema = z.string();
const filePathSchema = z.string().optional();

const analyzeShape = {
  content: contentSchema,
  language: languageEnum,
  filePath: filePathSchema,
};
const analyzeObj = z.object(analyzeShape);
const analyzeInputSchema = analyzeObj.strict();

const ruleIdSchema = z.string();
const checkShape = {
  content: contentSchema,
  ruleId: ruleIdSchema,
  language: languageEnum,
  filePath: filePathSchema,
};
const checkObj = z.object(checkShape);
const checkInputSchema = checkObj.strict();

const toTextResult = (payload: unknown): { content: Array<{ type: "text"; text: string }> } => {
  const json = JSON.stringify(payload);
  const textObj = { type: "text" as const, text: json };
  const result = {
    content: [textObj],
  };
  return result;
};

const toErrorResult = (message: string): {
  content: Array<{ type: "text"; text: string }>;
  isError: boolean;
} => {
  const errPayload = { error: message };
  const json = JSON.stringify(errPayload);
  const textObj = { type: "text" as const, text: json };
  const result = {
    content: [textObj],
    isError: true,
  };
  return result;
};

const registerAnalyzeTool = (server: McpServer): void => {
  const handler = async (args: unknown) => {
    const parsed = analyzeInputSchema.safeParse(args);
    const isSuccess = parsed.success;
    if (!isSuccess) {
      const msg = parsed.error.message;
      return toErrorResult(msg);
    }
    const data = parsed.data;
    const path = data.filePath;
    const hasPath = path !== undefined;
    const pathPart = hasPath ? { filePath: path } : {};
    const payload = {
      content: data.content,
      language: data.language,
      ...pathPart,
    };
    const result = runAnalyzeGovernanceTool(payload);
    const isErr = result.isErr();
    if (isErr) {
      const errMsg = result.error.message;
      return toErrorResult(errMsg);
    }
    const val = result.value;
    return toTextResult(val);
  };

  const config = {
    description: "Analyze code for governance violations",
    inputSchema: analyzeInputSchema.shape,
  };
  server.registerTool("analyze_governance", config, handler);
};

const registerCheckTool = (server: McpServer): void => {
  const handler = async (args: unknown) => {
    const parsed = checkInputSchema.safeParse(args);
    const isSuccess = parsed.success;
    if (!isSuccess) {
      const msg = parsed.error.message;
      return toErrorResult(msg);
    }
    const data = parsed.data;
    const path = data.filePath;
    const hasPath = path !== undefined;
    const pathPart = hasPath ? { filePath: path } : {};
    const payload = {
      content: data.content,
      ruleId: data.ruleId,
      language: data.language,
      ...pathPart,
    };
    const result = runCheckComplianceTool(payload);
    const isErr = result.isErr();
    if (isErr) {
      const errMsg = result.error.message;
      return toErrorResult(errMsg);
    }
    const val = result.value;
    return toTextResult(val);
  };

  const config = {
    description: "Check a single governance rule against a snippet",
    inputSchema: checkInputSchema.shape,
  };
  server.registerTool("check_compliance", config, handler);
};

const main = async (): Promise<void> => {
  const serverConfig = { name: "aad-governance", version: "0.1.0" };
  const server = new McpServer(serverConfig);

  registerAnalyzeTool(server);
  registerCheckTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

const runMain = () => {
  const handleError = () => {
    process.exitCode = 1;
  };
  main().catch(handleError);
};

runMain();
