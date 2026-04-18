import { z } from "zod";

export const pillarSchema = z.enum([
  "immutability",
  "pipes",
  "railways",
  "totalTyping",
  "smallFunctions",
  "patternMatching",
  "pureFunctions",
]);

export type Pillar = z.infer<typeof pillarSchema>;

export const enforcementTierSchema = z.enum(["enforced", "recommended", "aspirational"]);

export type EnforcementTier = z.infer<typeof enforcementTierSchema>;

export const languageSchema = z.enum(["typescript", "python", "both"]);

export type GovernanceLanguage = z.infer<typeof languageSchema>;

export const detectionStrategySchema = z.enum(["ast", "regex", "heuristic"]);

export type DetectionStrategy = z.infer<typeof detectionStrategySchema>;

export const fixStrategySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("regex-replace"),
    pattern: z.string(),
    replacement: z.string(),
  }),
  z.object({
    kind: z.literal("add-modifier"),
    modifier: z.string(),
  }),
  z.object({
    kind: z.literal("prepend-statement"),
    statement: z.string(),
  }),
  z.object({
    kind: z.literal("wrap-readonly"),
    target: z.string(),
  }),
]);

export type FixStrategy = z.infer<typeof fixStrategySchema>;

export const detectionPatternSchema = z
  .object({
    id: z.string(),
    description: z.string(),
    regex: z.string().optional(),
  })
  .readonly();

export type DetectionPattern = z.infer<typeof detectionPatternSchema>;

export const governanceRuleExamplesSchema = z
  .object({
    bad: z.string(),
    good: z.string(),
    explanation: z.string(),
  })
  .readonly();

export const governanceRuleSchema = z
  .object({
    id: z.string(),
    pillar: pillarSchema,
    tier: enforcementTierSchema,
    language: languageSchema,
    title: z.string(),
    description: z.string(),
    detectionStrategy: detectionStrategySchema,
    fixable: z.boolean(),
    fixStrategy: fixStrategySchema.optional(),
    patterns: z.array(detectionPatternSchema).readonly(),
    examples: governanceRuleExamplesSchema,
  })
  .readonly();

export type GovernanceRule = z.infer<typeof governanceRuleSchema>;

export const violationSchema = z
  .object({
    ruleId: z.string(),
    severity: enforcementTierSchema,
    message: z.string(),
    line: z.number().int().nonnegative(),
    column: z.number().int().nonnegative(),
    snippet: z.string(),
    suggestedFix: z.string().optional(),
  })
  .readonly();

export type Violation = z.infer<typeof violationSchema>;

export const analysisResultSchema = z
  .object({
    violations: z.array(violationSchema).readonly(),
    filePath: z.string(),
    language: z.enum(["typescript", "python"]),
  })
  .readonly();

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const violationActionSchema = z
  .object({
    type: z.enum(["auto-fix", "block", "warn"]),
    severity: enforcementTierSchema,
    message: z.string(),
    suggestedFix: z.string().optional(),
  })
  .readonly();

export type ViolationAction = z.infer<typeof violationActionSchema>;

export const hookToolNameSchema = z.enum(["write_file", "edit_file", "replace", "read_file"]);

export type HookToolName = z.infer<typeof hookToolNameSchema>;

export const hookInputSchema = z
  .object({
    tool_name: z.string(),
    tool_input: z.record(z.string(), z.unknown()).default({}),
  })
  .readonly();

export type HookInput = z.infer<typeof hookInputSchema>;

export const hookOutputSchema = z
  .object({
    decision: z.literal("deny").optional(),
    reason: z.string().optional(),
    hookSpecificOutput: z
      .object({
        tool_input: z.record(z.string(), z.unknown()),
        additionalContext: z.string().optional(),
      })
      .readonly()
      .optional(),
  })
  .readonly();

export type HookOutput = z.infer<typeof hookOutputSchema>;

export const hookErrorSchema = z
  .object({
    kind: z.literal("hook"),
    code: z.string(),
    message: z.string(),
  })
  .readonly();

export type HookError = z.infer<typeof hookErrorSchema>;
