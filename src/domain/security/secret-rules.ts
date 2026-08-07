import { ok, type Result } from "neverthrow";
import type { DomainError } from "#domain/errors.js";
import type { GovernanceRule, Violation } from "#domain/types.js";

const baseExamples = {
  bad: "example",
  good: "example",
  explanation: "Governance alignment",
} as const;

export const SECURITY_RULE_DEFINITIONS: ReadonlyArray<GovernanceRule> = [
  {
    id: "security-secret-aws-key",
    pillar: "security",
    tier: "enforced",
    language: "both",
    title: "No hardcoded AWS access keys",
    description: "AWS access key IDs must not be committed to source code",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "aws-key", description: "AKIA prefix key" }],
    examples: baseExamples,
  },
  {
    id: "security-secret-openai-key",
    pillar: "security",
    tier: "enforced",
    language: "both",
    title: "No hardcoded OpenAI keys",
    description: "OpenAI API keys must not be committed to source code",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "openai-key", description: "sk- prefix key" }],
    examples: baseExamples,
  },
  {
    id: "security-secret-private-key",
    pillar: "security",
    tier: "enforced",
    language: "both",
    title: "No hardcoded private keys",
    description: "Private key material must not be committed to source code",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "private-key", description: "PEM private key header" }],
    examples: baseExamples,
  },
  {
    id: "security-secret-jwt",
    pillar: "security",
    tier: "enforced",
    language: "both",
    title: "No hardcoded JWT tokens",
    description: "JWT tokens must not be committed to source code",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "jwt", description: "eyJ prefix token" }],
    examples: baseExamples,
  },
  {
    id: "security-secret-github-token",
    pillar: "security",
    tier: "enforced",
    language: "both",
    title: "No hardcoded GitHub tokens",
    description: "GitHub personal access tokens must not be committed to source code",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "github-token", description: "ghp_ prefix token" }],
    examples: baseExamples,
  },
  {
    id: "security-secret-generic-credential",
    pillar: "security",
    tier: "enforced",
    language: "both",
    title: "No hardcoded credentials",
    description: "Passwords, secrets, and API keys must not be hardcoded",
    detectionStrategy: "regex",
    fixable: false,
    patterns: [{ id: "generic-credential", description: "password/secret/api_key assignment" }],
    examples: baseExamples,
  },
  {
    id: "security-secret-high-entropy",
    pillar: "security",
    tier: "recommended",
    language: "both",
    title: "Suspicious high-entropy string",
    description: "High-entropy strings may indicate leaked secrets",
    detectionStrategy: "heuristic",
    fixable: false,
    patterns: [{ id: "high-entropy", description: "Shannon entropy heuristic" }],
    examples: baseExamples,
  },
];

// --- Regex-based detection (mirrors python-rules.ts RegexHit pattern) ---

type RegexHit = Readonly<{
  ruleId: string;
  tier: Violation["severity"];
  message: string;
  pattern: RegExp;
  skipPlaceholderFilter: boolean;
}>;

const regexHits: ReadonlyArray<RegexHit> = [
  {
    ruleId: "security-secret-aws-key",
    tier: "enforced",
    message: "Hardcoded AWS access key detected",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    skipPlaceholderFilter: true,
  },
  {
    ruleId: "security-secret-openai-key",
    tier: "enforced",
    message: "Hardcoded OpenAI API key detected",
    pattern: /\bsk-[A-Za-z0-9]{20,}\b/g,
    skipPlaceholderFilter: true,
  },
  {
    ruleId: "security-secret-private-key",
    tier: "enforced",
    message: "Private key material detected in source code",
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    skipPlaceholderFilter: true,
  },
  {
    ruleId: "security-secret-jwt",
    tier: "enforced",
    message: "Hardcoded JWT token detected",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    skipPlaceholderFilter: true,
  },
  {
    ruleId: "security-secret-github-token",
    tier: "enforced",
    message: "Hardcoded GitHub personal access token detected",
    pattern: /\bghp_[A-Za-z0-9]{36}\b/g,
    skipPlaceholderFilter: true,
  },
  {
    ruleId: "security-secret-generic-credential",
    tier: "enforced",
    message: "Hardcoded credential detected (password/secret/api_key/token assignment)",
    pattern: /(?:password|passwd|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
    skipPlaceholderFilter: false,
  },
];

// --- Allowlist / placeholder filter ---

const PLACEHOLDER_PATTERNS: ReadonlyArray<RegExp> = [
  /YOUR_API_KEY/i,
  /xxxx/i,
  /example/i,
  /changeme/i,
  /placeholder/i,
  /replace[_-]?me/i,
  /\<[^>]+\>/,
  /TODO/i,
  /FIXME/i,
  /dummy/i,
  /test[_-]?key/i,
  /fake/i,
  /mock/i,
  /sample/i,
];

const isPlaceholder = (snippet: string): boolean => {
  for (const pat of PLACEHOLDER_PATTERNS) {
    if (pat.test(snippet)) return true;
  }
  return false;
};

const isTestFilePath = (filePath: string): boolean => {
  const lower = filePath.toLowerCase();
  const hasTest = lower.includes("test");
  const hasFixture = lower.includes("fixture");
  const hasSpec = lower.includes("spec");
  const hasMock = lower.includes("mock");
  const result = hasTest || hasFixture || hasSpec || hasMock;
  return result;
};

// --- Shannon entropy heuristic ---

const shannonEntropy = (str: string): number => {
  const len = str.length;
  if (len === 0) return 0;

  const freq = new Map<string, number>();
  for (const ch of str) {
    const current = freq.get(ch) ?? 0;
    freq.set(ch, current + 1);
  }

  const entries = [...freq.values()];
  const calcEntropy = (acc: number, count: number): number => {
    const p = count / len;
    const contribution = p * Math.log2(p);
    const next = acc - contribution;
    return next;
  };

  const entropy = entries.reduce(calcEntropy, 0);
  return entropy;
};

const HIGH_ENTROPY_STRING_PATTERN = /['"`]([A-Za-z0-9+/=_\-]{20,})['"`]/g;

const ENTROPY_THRESHOLD = 4.0;

const isBase64OrHexLike = (str: string): boolean => {
  const base64Hex = /^[A-Za-z0-9+/=_\-]+$/;
  const result = base64Hex.test(str);
  return result;
};

const detectHighEntropyStrings = (code: string, filePath: string): readonly Violation[] => {
  const isTest = isTestFilePath(filePath);
  if (isTest) return [];

  const matches = [...code.matchAll(HIGH_ENTROPY_STRING_PATTERN)];
  const violations: Violation[] = [];

  for (const match of matches) {
    const captured = match[1];
    if (!captured) continue;
    if (!isBase64OrHexLike(captured)) continue;
    if (isPlaceholder(captured)) continue;

    const entropy = shannonEntropy(captured);
    const isHighEntropy = entropy >= ENTROPY_THRESHOLD;
    if (!isHighEntropy) continue;

    const index = match.index ?? 0;
    const line = lineFromIndex(code, index);
    const snippet = captured.slice(0, 120);

    const v: Violation = {
      ruleId: "security-secret-high-entropy",
      severity: "recommended",
      message: `Suspicious high-entropy string detected (entropy: ${entropy.toFixed(2)} bits/char)`,
      line,
      column: 1,
      snippet,
    };
    violations.push(v);
  }

  return violations;
};

// --- Core detection helpers ---

const lineFromIndex = (code: string, index: number): number => {
  const prefix = code.slice(0, index);
  const parts = prefix.split("\n");
  const count = parts.length;
  return count;
};

const processRegexHit = (code: string, filePath: string, hit: RegexHit): readonly Violation[] => {
  const matches = [...code.matchAll(hit.pattern)];
  const violations: Violation[] = [];

  for (const match of matches) {
    const rawSnippet = match[0];
    if (!hit.skipPlaceholderFilter && isPlaceholder(rawSnippet)) continue;

    const isTest = isTestFilePath(filePath);
    if (isTest) continue;

    const index = match.index ?? 0;
    const line = lineFromIndex(code, index);
    const snippet = rawSnippet.slice(0, 120);

    const v: Violation = {
      ruleId: hit.ruleId,
      severity: hit.tier,
      message: hit.message,
      line,
      column: 1,
      snippet,
    };
    violations.push(v);
  }

  return violations;
};

// --- Public API ---

export const detectSecretViolations = (
  code: string,
  filePath: string,
): Result<ReadonlyArray<Violation>, DomainError> => {
  const accumulateViolations = (acc: readonly Violation[], hit: RegexHit): readonly Violation[] => {
    const violations = processRegexHit(code, filePath, hit);
    const next = [...acc, ...violations];
    return next;
  };

  const regexViolations = regexHits.reduce(accumulateViolations, []);
  const entropyViolations = detectHighEntropyStrings(code, filePath);
  const allViolations = [...regexViolations, ...entropyViolations];
  const result = ok(allViolations);
  return result;
};
