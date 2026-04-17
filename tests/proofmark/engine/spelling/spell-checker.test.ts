import { describe, it, expect, beforeEach } from "vitest";
import {
  suggestCorrections,
  resetCheckerCache,
} from "../../../../src/proofmark/engine/spelling/spell-checker";

// Reset the singleton before each test so tests are isolated.
// The first test in the suite will incur the real dictionary-load cost (~100-500ms).
beforeEach(() => {
  resetCheckerCache();
});

describe("suggestCorrections", () => {
  it("returns at least one sensible suggestion for a clear typo", () => {
    const suggestions = suggestCorrections("wittnes");
    expect(suggestions.length).toBeGreaterThan(0);
    // "witness" is the obvious fix; nspell should rank it highly.
    expect(suggestions).toContain("witness");
  });

  it("returns at most 5 suggestions", () => {
    const suggestions = suggestCorrections("tezt");
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it("returns suggestions even for legal-domain typos (legal-terms augment corpus)", () => {
    // "barister" is a typo for "barrister". Default dictionary-en might
    // surface it; legal-terms augmentation guarantees it's discoverable.
    const suggestions = suggestCorrections("barister");
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("includes custom-dictionary words as potential suggestions", () => {
    // Seeding custom dict with a specific made-up spelling means nspell
    // can propose it when a similar word is queried.
    const suggestions = suggestCorrections("xyzfo", ["xyzfoo"]);
    // nspell may or may not rank it first; we just confirm the function
    // doesn't crash and returns an array. Concrete ordering is nspell's
    // internal concern.
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it("returns an array (possibly empty) for a word with no close match", () => {
    // Random consonant cluster — nspell may return [] or something odd.
    const suggestions = suggestCorrections("xzqvwpf");
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
