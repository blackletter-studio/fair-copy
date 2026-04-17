import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { nonBreakingSectionSignCheck } from "../../../../src/proofmark/engine/checks/non-breaking-section-sign";

describe("non-breaking-section-sign check", () => {
  it("flags '\u00a7 1234' and suggests NBSP between sign and number", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "See \u00a7 1234 of the Code."),
    ]);
    const findings = nonBreakingSectionSignCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.suggestedText).toBe("See \u00a7\u00a01234 of the Code.");
  });

  it("does not flag when NBSP is already present", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "See \u00a7\u00a01234."),
    ]);
    expect(nonBreakingSectionSignCheck.run(adapter, null, { mode: "destructive" })).toHaveLength(0);
  });

  it("returns empty when mode is 'off'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "\u00a7 1")]);
    expect(nonBreakingSectionSignCheck.run(adapter, null, { mode: "off" })).toHaveLength(0);
  });
});
