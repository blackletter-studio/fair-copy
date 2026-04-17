import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { crossReferenceIntegrityCheck } from "../../../../src/proofmark/engine/checks/cross-reference-integrity";

describe("cross-reference-integrity check", () => {
  it("flags a reference to a missing section", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "See Section 5 for details."),
      FakeDocumentAdapter.makeParagraph("h1", "Section 3", { headingStyle: "heading-1" }),
      FakeDocumentAdapter.makeParagraph("p2", "Content."),
    ]);
    const findings = crossReferenceIntegrityCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.message).toContain("Section 5");
  });

  it("does not flag when the target exists", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "See Section 3 for details."),
      FakeDocumentAdapter.makeParagraph("h1", "Section 3", { headingStyle: "heading-1" }),
      FakeDocumentAdapter.makeParagraph("p2", "Content."),
    ]);
    expect(crossReferenceIntegrityCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("flags missing Exhibit references", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Attached as Exhibit B."),
    ]);
    const findings = crossReferenceIntegrityCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
  });
});
