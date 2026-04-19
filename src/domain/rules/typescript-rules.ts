import * as ts from "typescript";
import { err, ok, type Result } from "neverthrow";
import { domainError, type DomainError } from "#domain/errors.js";
import type { GovernanceRule, Violation } from "#domain/types.js";

const baseExamples = {
  bad: "example",
  good: "example",
  explanation: "Governance alignment",
} as const;

export const TYPESCRIPT_RULE_DEFINITIONS: ReadonlyArray<GovernanceRule> = [
  {
    id: "immutability-no-let",
    pillar: "immutability",
    tier: "enforced",
    language: "typescript",
    title: "Prefer const",
    description: "Avoid let when value is not reassigned",
    detectionStrategy: "ast",
    fixable: true,
    fixStrategy: { kind: "add-modifier", modifier: "const" },
    patterns: [{ id: "let", description: "let declarations" }],
    examples: baseExamples,
  },
  {
    id: "immutability-no-push",
    pillar: "immutability",
    tier: "enforced",
    language: "typescript",
    title: "Avoid mutating array methods",
    description: "Disallow push/splice/sort mutations",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "push", description: "array mutation" }],
    examples: baseExamples,
  },
  {
    id: "pipes-no-nested-calls",
    pillar: "pipes",
    tier: "enforced",
    language: "typescript",
    title: "Avoid nested calls",
    description: "Prefer pipe composition over f(g(h(x)))",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "nested", description: "nested call expressions" }],
    examples: baseExamples,
  },
  {
    id: "railways-no-bare-catch",
    pillar: "railways",
    tier: "enforced",
    language: "typescript",
    title: "No bare catch",
    description: "Catch blocks must handle errors",
    detectionStrategy: "ast",
    fixable: true,
    fixStrategy: { kind: "prepend-statement", statement: "TODO" },
    patterns: [{ id: "catch", description: "empty catch" }],
    examples: baseExamples,
  },
  {
    id: "total-typing-no-any",
    pillar: "totalTyping",
    tier: "enforced",
    language: "typescript",
    title: "No any",
    description: "Disallow any and unsafe casts",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "any", description: "any keyword" }],
    examples: baseExamples,
  },
  {
    id: "total-typing-explicit-return",
    pillar: "totalTyping",
    tier: "recommended",
    language: "typescript",
    title: "Explicit return types",
    description: "Top-level functions should declare return types",
    detectionStrategy: "heuristic",
    fixable: false,
    patterns: [{ id: "return-type", description: "missing annotation" }],
    examples: baseExamples,
  },
  {
    id: "small-functions-max-lines",
    pillar: "smallFunctions",
    tier: "recommended",
    language: "typescript",
    title: "Small functions",
    description: "Functions should be <= 15 lines",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "size", description: "function length" }],
    examples: baseExamples,
  },
  {
    id: "pattern-matching-exhaustive-switch",
    pillar: "patternMatching",
    tier: "recommended",
    language: "typescript",
    title: "Exhaustive switch",
    description: "Switch should end with assertNever default",
    detectionStrategy: "heuristic",
    fixable: false,
    fixStrategy: { kind: "prepend-statement", statement: "default" },
    patterns: [{ id: "switch", description: "switch default" }],
    examples: baseExamples,
  },
  {
    id: "antipattern-no-default-export",
    pillar: "immutability",
    tier: "enforced",
    language: "typescript",
    title: "No default exports",
    description: "Prefer named exports",
    detectionStrategy: "ast",
    fixable: true,
    fixStrategy: { kind: "regex-replace", pattern: "", replacement: "" },
    patterns: [{ id: "export-default", description: "export default" }],
    examples: baseExamples,
  },
  {
    id: "antipattern-no-console-log",
    pillar: "pureFunctions",
    tier: "enforced",
    language: "typescript",
    title: "No console.log",
    description: "Avoid console.log in production sources",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "console", description: "console.log" }],
    examples: baseExamples,
  },
  {
    id: "railways-no-throw",
    pillar: "railways",
    tier: "enforced",
    language: "typescript",
    title: "No throw in logic",
    description: "Prefer Result types over throw",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "throw", description: "throw statement" }],
    examples: baseExamples,
  },
  {
    id: "pure-functions-no-global-state",
    pillar: "pureFunctions",
    tier: "recommended",
    language: "typescript",
    title: "No non-deterministic globals",
    description: "Avoid Date.now, Math.random, fetch in pure logic",
    detectionStrategy: "ast",
    fixable: false,
    patterns: [{ id: "globals", description: "global calls" }],
    examples: baseExamples,
  },
];

type VisitContext = {
  readonly sourceFile: ts.SourceFile;
  readonly isTestFile: boolean;
  violations: readonly Violation[];
};

const createViolation = (
  ctx: VisitContext,
  ruleId: string,
  tier: Violation["severity"],
  message: string,
  node: ts.Node,
  snippet: string,
): Violation => {
  const sf = ctx.sourceFile;
  const pos = node.getStart(sf);
  const { line, character } = sf.getLineAndCharacterOfPosition(pos);
  const result: Violation = {
    ruleId,
    severity: tier,
    message,
    line: line + 1,
    column: character + 1,
    snippet,
  };
  return result;
};

const getSnippet = (sourceFile: ts.SourceFile, node: ts.Node): string => {
  const text = node.getText(sourceFile);
  const isLong = text.length > 120;
  const result = isLong ? `${text.slice(0, 117)}...` : text;
  return result;
};

const isLetInAllowedForInitializer = (node: ts.VariableDeclaration): boolean => {
  const list = node.parent;
  const isList = ts.isVariableDeclarationList(list);
  if (!isList) return false;
  const parent = list.parent;
  const isFor = ts.isForStatement(parent);
  if (!isFor) return false;
  const isInit = parent.initializer === list;
  return isInit;
};

const hasMeaningfulCatchBody = (block: ts.Block | undefined): boolean => {
  if (!block) return false;
  const stmts = block.statements;
  const hasStmts = stmts.length > 0;
  return hasStmts;
};

const subtreeContainsNestedCall = (root: ts.Expression): boolean => {
  const state = { found: false };
  const walk = (n: ts.Node): void => {
    const alreadyFound = state.found;
    if (alreadyFound) return;
    const isNotRoot = n !== root;
    const isCall = ts.isCallExpression(n);
    if (isNotRoot && isCall) {
      state.found = true;
      return;
    }
    ts.forEachChild(n, walk);
  };
  walk(root);
  const result = state.found;
  return result;
};

const argumentIntroducesCallNesting = (arg: ts.Expression): boolean => {
  const isCall = ts.isCallExpression(arg);
  const hasNested = subtreeContainsNestedCall(arg);
  const result = isCall || hasNested;
  return result;
};

const checkVariableDeclaration = (ctx: VisitContext, node: ts.Node): void => {
  const isVarList = ts.isVariableDeclarationList(node);
  if (!isVarList) return;
  const flags = node.flags;
  const isLet = (flags & ts.NodeFlags.Let) !== 0;
  if (!isLet) return;

  const decls = node.declarations;
  const sf = ctx.sourceFile;
  const checkDecl = (decl: ts.VariableDeclaration) => {
    const isAllowed = isLetInAllowedForInitializer(decl);
    if (isAllowed) return;
    const snippet = getSnippet(sf, decl);
    const v = createViolation(ctx, "immutability-no-let", "enforced", "Use const unless the binding is reassigned", decl.name, snippet);
    ctx.violations = [...ctx.violations, v];
  };
  decls.forEach(checkDecl);
};

const checkCallExpression = (ctx: VisitContext, node: ts.Node): void => {
  const isCall = ts.isCallExpression(node);
  if (!isCall) return;
  const sf = ctx.sourceFile;
  const expr = node.expression;
  const exprText = expr.getText(sf);
  const snippet = getSnippet(sf, node);

  const isMutator = exprText.endsWith(".push") || exprText.endsWith(".splice") || exprText.endsWith(".sort");
  if (isMutator) {
    const v = createViolation(ctx, "immutability-no-push", "enforced", "Avoid mutating array/object methods; prefer immutable updates", node, snippet);
    ctx.violations = [...ctx.violations, v];
  }

  const args = node.arguments;
  const hasNested = args.some(argumentIntroducesCallNesting);
  if (!ctx.isTestFile && hasNested) {
    const v = createViolation(ctx, "pipes-no-nested-calls", "enforced", "Avoid nested calls; compose with pipes or intermediate bindings (Pipes pillar)", node, snippet);
    ctx.violations = [...ctx.violations, v];
  }

  const isLog = exprText === "console.log";
  if (!ctx.isTestFile && isLog) {
    const v = createViolation(ctx, "antipattern-no-console-log", "enforced", "console.log is forbidden outside tests", node, snippet);
    ctx.violations = [...ctx.violations, v];
  }

  const isNonDet = exprText === "Date.now" || exprText === "Math.random" || exprText === "fetch";
  if (isNonDet) {
    const v = createViolation(ctx, "pure-functions-no-global-state", "recommended", "Avoid non-deterministic globals in business logic", node, snippet);
    ctx.violations = [...ctx.violations, v];
  }
};

const checkRailways = (ctx: VisitContext, node: ts.Node): void => {
  const sf = ctx.sourceFile;
  const snippet = getSnippet(sf, node);
  if (ts.isThrowStatement(node)) {
    const v = createViolation(ctx, "railways-no-throw", "enforced", "throw is discouraged in domain logic; prefer Result types", node, snippet);
    ctx.violations = [...ctx.violations, v];
  }
  if (ts.isCatchClause(node)) {
    const block = node.block;
    const isMeaningful = hasMeaningfulCatchBody(block);
    if (!isMeaningful) {
      const v = createViolation(ctx, "railways-no-bare-catch", "enforced", "Bare catch blocks must handle the error", node, snippet);
      ctx.violations = [...ctx.violations, v];
    }
  }
};

const checkTyping = (ctx: VisitContext, node: ts.Node): void => {
  const sf = ctx.sourceFile;
  const snippet = getSnippet(sf, node);
  const isAnyKeyword = node.kind === ts.SyntaxKind.AnyKeyword;
  const isAnyCast = ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.AnyKeyword;
  const isAnyRef = ts.isTypeReferenceNode(node) && node.typeName.getText(sf) === "any";

  if (isAnyKeyword || isAnyCast || isAnyRef) {
    const msg = isAnyCast ? "as any casts are forbidden" : isAnyRef ? "any type references are forbidden" : "any is forbidden; use precise types";
    const v = createViolation(ctx, "total-typing-no-any", "enforced", msg, node, snippet);
    ctx.violations = [...ctx.violations, v];
  }
};

const checkFunctionAndSwitch = (ctx: VisitContext, node: ts.Node): void => {
  const sf = ctx.sourceFile;
  const snippet = getSnippet(sf, node);
  if (ts.isFunctionDeclaration(node) && node.name && node.body) {
    const pos = node.getStart(sf);
    const start = sf.getLineAndCharacterOfPosition(pos);
    const end = sf.getLineAndCharacterOfPosition(node.body.end);
    const lines = end.line - start.line + 1;
    if (lines > 15) {
      const msg = `Function spans ${String(lines)} lines; keep functions <= 15 lines`;
      const v = createViolation(ctx, "small-functions-max-lines", "recommended", msg, node, snippet);
      ctx.violations = [...ctx.violations, v];
    }
    if (!ctx.isTestFile && !node.type) {
      const v = createViolation(ctx, "total-typing-explicit-return", "recommended", "Add an explicit return type annotation", node, snippet);
      ctx.violations = [...ctx.violations, v];
    }
  }
  if (ts.isSwitchStatement(node)) {
    const clauses = node.caseBlock.clauses;
    const hasDefault = clauses.some(ts.isDefaultClause);
    if (!hasDefault) {
      const v = createViolation(ctx, "pattern-matching-exhaustive-switch", "recommended", "Switch should include a default branch with assertNever", node, snippet);
      ctx.violations = [...ctx.violations, v];
    }
  }
  if (ts.isExportAssignment(node) && node.isExportEquals === false) {
    const v = createViolation(ctx, "antipattern-no-default-export", "enforced", "default exports are forbidden; use named exports", node, snippet);
    ctx.violations = [...ctx.violations, v];
  }
};

export const detectTypeScriptViolations = (
  code: string,
  filePath: string,
): Result<ReadonlyArray<Violation>, DomainError> => {
  const getSf = (): ts.SourceFile | null => {
    try {
      const target = ts.ScriptTarget.Latest;
      const kind = ts.ScriptKind.TSX;
      return ts.createSourceFile(filePath, code, target, true, kind);
    } catch {
      return null;
    }
  };
  const sourceFile = getSf();
  if (!sourceFile) return ok([]);

  const isTestPart1 = filePath.includes(".test.");
  const isTestPart2 = filePath.includes("/tests/");
  const isTestPart3 = filePath.includes("\\tests\\");
  const isTest = isTestPart1 || isTestPart2 || isTestPart3;
  const ctx: VisitContext = { sourceFile, isTestFile: isTest, violations: [] };

  const visit = (node: ts.Node): void => {
    checkVariableDeclaration(ctx, node);
    checkCallExpression(ctx, node);
    checkRailways(ctx, node);
    checkTyping(ctx, node);
    checkFunctionAndSwitch(ctx, node);
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  const finalViolations = ctx.violations;
  const count = finalViolations.length;
  const isTooMany = count > 10000;
  if (isTooMany) {
    const dErr = domainError("typescript-rules", "Too many violations; aborting");
    return err(dErr);
  }
  return ok(finalViolations);
};
