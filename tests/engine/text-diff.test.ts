import { describe, it, expect } from "vitest";
import { minimalReplacements } from "../../src/engine/text-diff";

describe("minimalReplacements", () => {
  it("returns empty array when texts are identical", () => {
    expect(minimalReplacements("hello", "hello")).toEqual([]);
  });

  it("handles a single-character change at a unique location", () => {
    const r = minimalReplacements("document's appearance", "document\u2019s appearance");
    expect(r).toHaveLength(1);
    // The find string contains the changed char and enough context to be unique.
    expect("document's appearance".includes(r[0]!.find)).toBe(true);
    // Applying the replacement produces the new text.
    expect("document's appearance".replace(r[0]!.find, r[0]!.replace)).toBe(
      "document\u2019s appearance",
    );
  });

  it("handles two-space collapse", () => {
    const r = minimalReplacements("Smith  v.  Jones", "Smith v. Jones");
    expect(r).toHaveLength(1);
    expect("Smith  v.  Jones".replace(r[0]!.find, r[0]!.replace)).toBe("Smith v. Jones");
  });

  it("find string is always unique in oldText (single change)", () => {
    const old = "a b c a d";
    const neu = "a b c a e";
    const r = minimalReplacements(old, neu);
    expect(r).toHaveLength(1);
    // find must be unique in old
    const count = (
      old.match(new RegExp(r[0]!.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []
    ).length;
    expect(count).toBe(1);
  });

  it("falls back to whole-text replace when no unique context exists", () => {
    // Extreme: "aaaa" → "bbbb" has no unique sub-context inside the changed region.
    const r = minimalReplacements("aaaa", "bbbb");
    expect(r).toHaveLength(1);
    expect("aaaa".replace(r[0]!.find, r[0]!.replace)).toBe("bbbb");
  });
});
