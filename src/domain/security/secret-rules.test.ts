import { describe, expect, it } from "vitest";
import { detectSecretViolations } from "#domain/security/secret-rules.js";

describe("detectSecretViolations", () => {
  // --- Positive cases: each pattern should fire ---

  it("detects AWS access key", () => {
    const code = `const key = "AKIAIOSFODNN7EXAMPLE";`;
    const result = detectSecretViolations(code, "src/config.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasAws = violations.some((v) => v.ruleId === "security-secret-aws-key");
    expect(hasAws).toBe(true);
  });

  it("detects OpenAI-style key", () => {
    const code = `const apiKey = "sk-abcdefghijklmnopqrstuvwxyz1234567890";`;
    const result = detectSecretViolations(code, "src/config.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasOpenai = violations.some((v) => v.ruleId === "security-secret-openai-key");
    expect(hasOpenai).toBe(true);
  });

  it("detects private key header", () => {
    const code = `const pem = "-----BEGIN RSA PRIVATE KEY-----\\nMIIEow..."`;
    const result = detectSecretViolations(code, "src/crypto.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasPk = violations.some((v) => v.ruleId === "security-secret-private-key");
    expect(hasPk).toBe(true);
  });

  it("detects JWT token", () => {
    const code = `const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";`;
    const result = detectSecretViolations(code, "src/auth.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasJwt = violations.some((v) => v.ruleId === "security-secret-jwt");
    expect(hasJwt).toBe(true);
  });

  it("detects GitHub personal access token", () => {
    const code = `const ghToken = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";`;
    const result = detectSecretViolations(code, "src/github.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasGh = violations.some((v) => v.ruleId === "security-secret-github-token");
    expect(hasGh).toBe(true);
  });

  it("detects generic credential assignment", () => {
    const code = `const password = "supersecretpassword123";`;
    const result = detectSecretViolations(code, "src/db.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasGeneric = violations.some((v) => v.ruleId === "security-secret-generic-credential");
    expect(hasGeneric).toBe(true);
  });

  // --- Negative cases: placeholders must NOT fire ---

  it("does not flag placeholder YOUR_API_KEY", () => {
    const code = `const key = "YOUR_API_KEY_HERE";`;
    const result = detectSecretViolations(code, "src/config.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasGeneric = violations.some((v) => v.ruleId === "security-secret-generic-credential");
    expect(hasGeneric).toBe(false);
  });

  it("does not flag example placeholders", () => {
    const code = `const token = "example-token-for-docs";`;
    const result = detectSecretViolations(code, "src/config.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const hasGeneric = violations.some((v) => v.ruleId === "security-secret-generic-credential");
    expect(hasGeneric).toBe(false);
  });

  it("does not flag test files", () => {
    const code = `const key = "AKIAIOSFODNN7EXAMPLE";`;
    const result = detectSecretViolations(code, "src/config.test.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    expect(violations.length).toBe(0);
  });

  it("does not flag fixture files", () => {
    const code = `const password = "realsecretvalue123456";`;
    const result = detectSecretViolations(code, "tests/fixtures/sample.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    expect(violations.length).toBe(0);
  });

  // --- Entropy heuristic ---

  it("flags high-entropy strings as recommended", () => {
    // A random-looking base64 string with high entropy
    const code = `const data = "a8K3mP9xQ2rT5vW7yB4dF6hJ1kL0nO3";`;
    const result = detectSecretViolations(code, "src/config.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const entropyHits = violations.filter((v) => v.ruleId === "security-secret-high-entropy");
    if (entropyHits.length > 0) {
      expect(entropyHits[0]?.severity).toBe("recommended");
    }
  });

  it("does not flag low-entropy strings", () => {
    const code = `const data = "aaaaaaaaaaaaaaaaaaaaaa";`;
    const result = detectSecretViolations(code, "src/config.ts");
    expect(result.isOk()).toBe(true);
    const violations = result._unsafeUnwrap();
    const entropyHits = violations.filter((v) => v.ruleId === "security-secret-high-entropy");
    expect(entropyHits.length).toBe(0);
  });
});
