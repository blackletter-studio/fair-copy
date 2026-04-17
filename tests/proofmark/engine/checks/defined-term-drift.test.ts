import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { definedTermDriftCheck } from "../../../../src/proofmark/engine/checks/defined-term-drift";

describe("defined-term-drift check", () => {
  it("flags lowercase use of a capitalized defined term", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", '"Buyer" means ABC Corp.'),
      FakeDocumentAdapter.makeParagraph("p2", "The buyer shall deliver the goods."),
    ]);
    const findings = definedTermDriftCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.message).toContain("Buyer");
  });

  it("does not flag correct casing", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", '"Buyer" means ABC Corp.'),
      FakeDocumentAdapter.makeParagraph("p2", "The Buyer shall deliver the goods."),
    ]);
    const findings = definedTermDriftCheck.run(adapter, null, { mode: "interactive" });
    expect(findings).toHaveLength(0);
  });

  it("ignores documents with no definitions", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Plain prose."),
    ]);
    expect(definedTermDriftCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("produces suggestedText recasing the lowercase term to canonical", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", '"Buyer" means ABC Corp.'),
      FakeDocumentAdapter.makeParagraph("p2", "The buyer shall deliver the goods."),
    ]);
    const findings = definedTermDriftCheck.run(adapter, null, { mode: "interactive" });
    const drift = findings.find((f) => f.range.id === "p2");
    expect(drift?.suggestedText).toBe("The Buyer shall deliver the goods.");
  });
});
