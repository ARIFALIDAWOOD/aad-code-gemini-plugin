import { describe, expect, it } from "vitest";
import { generateGeminiMarkdown } from "#application/generate-gemini-md.js";

describe("generateGeminiMarkdown", () => {
  it("includes all pillars", () => {
    const md = generateGeminiMarkdown();
    expect(md).toContain("## immutability");
    expect(md).toContain("## pipes");
    expect(md).toContain("## railways");
    expect(md).toContain("## totalTyping");
    expect(md).toContain("## smallFunctions");
    expect(md).toContain("## patternMatching");
    expect(md).toContain("## pureFunctions");
  });

  it("marks enforcement tiers", () => {
    const md = generateGeminiMarkdown();
    expect(md).toMatch(/\[ENFORCED]/);
  });
});
