import * as ts from "typescript";
import { err, ok, type Result } from "neverthrow";
import { domainError, type DomainError } from "#domain/errors.js";

const isLetInAllowedForInitializer = (list: ts.VariableDeclarationList): boolean => {
  const parent = list.parent;
  return ts.isForStatement(parent) && parent.initializer === list;
};

export const applyLetToConst = (code: string, filePath: string): Result<string, DomainError> => {
  const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const transformer = (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    const visit: ts.Visitor = (node) => {
      if (
        ts.isVariableDeclarationList(node) &&
        (node.flags & ts.NodeFlags.Let) !== 0 &&
        !isLetInAllowedForInitializer(node)
      ) {
        return context.factory.createVariableDeclarationList(node.declarations, ts.NodeFlags.Const);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformed = result.transformed[0];
  result.dispose();
  if (!transformed) {
    return err(domainError("typescript-fixers", "Transform failed"));
  }
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return ok(printer.printFile(transformed));
};

export const applyBareCatchComment = (code: string): Result<string, DomainError> => {
  const updated = code.replace(
    /catch\s*\([^)]*\)\s*\{\s*\}/g,
    "catch (error) { /* TODO: handle error - see aad-governance/PATTERNS.md */ void error; }",
  );
  return ok(updated);
};

export const applyDefaultExportNamed = (code: string): Result<string, DomainError> => {
  if (!code.includes("export default")) {
    return ok(code);
  }
  let updated = code;
  updated = updated.replace(/export\s+default\s+function\s+(\w+)/g, "export function $1");
  updated = updated.replace(/export\s+default\s+class\s+(\w+)/g, "export class $1");
  updated = updated.replace(/export\s+default\s+/g, "export ");
  return ok(updated);
};
