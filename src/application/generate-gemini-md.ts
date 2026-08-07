import { ALL_GOVERNANCE_RULES } from "#domain/rules/rule-registry.js";

const formatRule = (rule: (typeof ALL_GOVERNANCE_RULES)[number]): string => {
  const tier = rule.tier;
  const upperTier = tier.toUpperCase();
  const id = rule.id;
  const title = rule.title;
  const result = `- **${id}** [${upperTier}] — ${title}`;
  return result;
};

const generateSection = (pillar: string): string => {
  const isSamePillar = (rule: (typeof ALL_GOVERNANCE_RULES)[number]): boolean => rule.pillar === pillar;
  const rules = ALL_GOVERNANCE_RULES.filter(isSamePillar);
  const ruleLines = rules.map(formatRule);
  const lines = ruleLines.join("\n");
  const content = lines || "_No rules registered._";
  const section = `## ${pillar}

${content}
`;
  return section;
};

export const generateGeminiMarkdown = (): string => {
  const pillars = [
    "immutability",
    "pipes",
    "railways",
    "totalTyping",
    "smallFunctions",
    "patternMatching",
    "pureFunctions",
    "security",
  ] as const;

  const header = `# AAD Governance Digest

This file is generated from the canonical rule registry. It is intentionally concise and avoids large code samples.

`;

  const sections = pillars.map(generateSection);
  const body = sections.join("\n");
  const result = `${header}${body}`;
  return result;
};
