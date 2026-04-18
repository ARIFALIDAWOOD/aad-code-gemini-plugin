import { describe, expect, it } from "vitest";
import { governanceRuleSchema, pillarSchema } from "#domain/types.js";

describe("governanceRuleSchema", () => {
  it("accepts a well-formed governance rule", () => {
    const parsed = governanceRuleSchema.safeParse({
      id: "immutability-no-let",
      pillar: "immutability",
      tier: "enforced",
      language: "typescript",
      title: "Prefer const",
      description: "Disallow let when not reassigned",
      detectionStrategy: "ast",
      fixable: true,
      fixStrategy: { kind: "add-modifier", modifier: "const" },
      patterns: [{ id: "let-decl", description: "let keyword" }],
      examples: {
        bad: "let x = 1;",
        good: "const x = 1;",
        explanation: "Immutability",
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects malformed governance rules", () => {
    const parsed = governanceRuleSchema.safeParse({
      id: "broken",
      tier: "enforced",
      fixable: true,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("pillarSchema", () => {
  it("rejects unknown pillars", () => {
    const parsed = pillarSchema.safeParse("unknown");
    expect(parsed.success).toBe(false);
  });
});
