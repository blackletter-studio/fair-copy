import { describe, it, expect } from "vitest";
import { deduplicateFindings } from "../../../src/proofmark/findings/dedup";
import type { Finding } from "../../../src/proofmark/engine/types";

function makeFinding(overrides: Partial<Finding>): Finding {
  return {
    id: "f-default",
    checkName: "straight-quotes",
    region: "document",
    range: { id: "para-0", kind: "paragraph" },
    excerpt: "x",
    severity: "info",
    confidence: "high",
    message: "m",
    ...overrides,
  };
}

describe("deduplicateFindings", () => {
  it("returns empty array unchanged", () => {
    expect(deduplicateFindings([])).toEqual([]);
  });

  it("keeps distinct findings", () => {
    const a = makeFinding({ id: "a", range: { id: "para-0", kind: "paragraph" } });
    const b = makeFinding({ id: "b", range: { id: "para-1", kind: "paragraph" } });
    expect(deduplicateFindings([a, b])).toHaveLength(2);
  });

  it("merges same check + same range — keeps the first", () => {
    const a = makeFinding({ id: "a", checkName: "straight-quotes" });
    const b = makeFinding({ id: "b", checkName: "straight-quotes" });
    const result = deduplicateFindings([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("keeps different checks at same range", () => {
    const a = makeFinding({ id: "a", checkName: "straight-quotes" });
    const b = makeFinding({ id: "b", checkName: "em-en-dashes" });
    expect(deduplicateFindings([a, b])).toHaveLength(2);
  });

  it("picks higher severity when merging same-check + same-range duplicates", () => {
    const a = makeFinding({ id: "a", checkName: "straight-quotes", severity: "info" });
    const b = makeFinding({ id: "b", checkName: "straight-quotes", severity: "error" });
    const result = deduplicateFindings([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0]?.severity).toBe("error");
    expect(result[0]?.id).toBe("b");
  });
});
