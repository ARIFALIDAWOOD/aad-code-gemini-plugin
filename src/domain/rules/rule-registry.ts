import type { GovernanceRule, Violation, ViolationAction } from "#domain/types.js";
import { PYTHON_RULE_DEFINITIONS } from "#domain/rules/python-rules.js";
import { TYPESCRIPT_RULE_DEFINITIONS } from "#domain/rules/typescript-rules.js";
import { SECURITY_RULE_DEFINITIONS } from "#domain/security/secret-rules.js";

export const ALL_GOVERNANCE_RULES: ReadonlyArray<GovernanceRule> = [
  ...TYPESCRIPT_RULE_DEFINITIONS,
  ...PYTHON_RULE_DEFINITIONS,
  ...SECURITY_RULE_DEFINITIONS,
];

const ruleById = new Map<string, GovernanceRule>(
  ALL_GOVERNANCE_RULES.map((rule) => [rule.id, rule]),
);

export const getRuleById = (ruleId: string): GovernanceRule | undefined => ruleById.get(ruleId);

export const classifyViolation = (violation: Violation): ViolationAction => {
  const rule = getRuleById(violation.ruleId);
  const tier = rule?.tier ?? violation.severity;
  const fixable = rule?.fixable ?? false;

  if (tier === "aspirational") {
    return {
      type: "warn",
      severity: tier,
      message: violation.message,
      suggestedFix: violation.suggestedFix,
    };
  }

  if (tier === "enforced") {
    if (fixable) {
      return {
        type: "auto-fix",
        severity: tier,
        message: violation.message,
        suggestedFix: violation.suggestedFix,
      };
    }
    return {
      type: "block",
      severity: tier,
      message: `${violation.message} (see aad-governance/PATTERNS.md)`,
      suggestedFix: violation.suggestedFix,
    };
  }

  if (fixable) {
    return {
      type: "auto-fix",
      severity: tier,
      message: violation.message,
      suggestedFix: violation.suggestedFix,
    };
  }

  return {
    type: "warn",
    severity: tier,
    message: violation.message,
    suggestedFix: violation.suggestedFix,
  };
};
