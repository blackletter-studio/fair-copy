import { describe, it, expect, beforeEach } from "vitest";
import {
  checkParagraph,
  resetCheckerCache,
} from "../../../../src/proofmark/engine/spelling/spell-checker";

// Reset the singleton before each test so tests are isolated.
// The first test in the suite will incur the real dictionary-load cost (~100-500ms).
beforeEach(() => {
  resetCheckerCache();
});

describe("checkParagraph", () => {
  it("flags a clearly misspelled word and returns suggestions", async () => {
    const results = await checkParagraph("The wittnes testified.");
    const flagged = results.find((r) => r.word === "wittnes");
    expect(flagged).toBeDefined();
    expect(flagged!.suggestions.length).toBeGreaterThan(0);
    expect(flagged!.legalConfusionFix).toBeUndefined();
  });

  it("returns empty array for a correctly spelled sentence", async () => {
    const results = await checkParagraph("The witness testified in court.");
    expect(results).toHaveLength(0);
  });

  it("does not flag legal terms from the legal-terms whitelist", async () => {
    // These words would be unknown to a standard dictionary.
    const results = await checkParagraph(
      "The indemnitor and indemnitee shall agree notwithstanding the estoppel doctrine.",
    );
    // None of the legal terms should be flagged.
    const legalWords = ["indemnitor", "indemnitee", "notwithstanding", "estoppel"];
    for (const word of legalWords) {
      const flagged = results.find((r) => r.word.toLowerCase() === word);
      expect(flagged, `"${word}" should not be flagged`).toBeUndefined();
    }
  });

  it("flags legal-confusion pairs and provides the correct fix", async () => {
    // "judgement" is the US-legal confusion pair — should be "judgment"
    const results = await checkParagraph("The court issued its judgement.");
    const flagged = results.find((r) => r.word.toLowerCase() === "judgement");
    expect(flagged).toBeDefined();
    expect(flagged!.legalConfusionFix).toBe("judgment");
    expect(flagged!.suggestions[0]).toBe("judgment");
  });

  it("flags 'defendent' as a legal confusion pair", async () => {
    const results = await checkParagraph("The defendent failed to appear.");
    const flagged = results.find((r) => r.word.toLowerCase() === "defendent");
    expect(flagged).toBeDefined();
    expect(flagged!.legalConfusionFix).toBe("defendant");
  });

  it("preserves Title Case in the suggested fix", async () => {
    const results = await checkParagraph("The Defendent failed to appear.");
    const flagged = results.find((r) => r.word === "Defendent");
    expect(flagged).toBeDefined();
    expect(flagged!.legalConfusionFix).toBe("Defendant");
  });

  it("preserves UPPER CASE in the suggested fix", async () => {
    const results = await checkParagraph("THE DEFENDENT FAILED TO APPEAR.");
    const flagged = results.find((r) => r.word === "DEFENDENT");
    expect(flagged).toBeDefined();
    expect(flagged!.legalConfusionFix).toBe("DEFENDANT");
  });

  it("respects words added via custom dictionary", async () => {
    // "xyzfoo" would normally be unknown — adding it should suppress the flag.
    const withoutCustom = await checkParagraph("The xyzfoo clause applies.");
    expect(withoutCustom.find((r) => r.word === "xyzfoo")).toBeDefined();

    resetCheckerCache();
    const withCustom = await checkParagraph("The xyzfoo clause applies.", ["xyzfoo"]);
    expect(withCustom.find((r) => r.word === "xyzfoo")).toBeUndefined();
  });

  it("records the correct character offset for flagged words", async () => {
    const text = "The wittnes testified.";
    const results = await checkParagraph(text);
    const flagged = results.find((r) => r.word === "wittnes");
    expect(flagged).toBeDefined();
    expect(flagged!.offset).toBe(text.indexOf("wittnes"));
  });
});
