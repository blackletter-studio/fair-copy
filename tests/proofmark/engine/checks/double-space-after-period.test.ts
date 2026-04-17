import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { doubleSpaceAfterPeriodCheck } from "../../../../src/proofmark/engine/checks/double-space-after-period";

describe("double-space-after-period check", () => {
  it("flags two spaces after a period", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "First sentence.  Second sentence."),
    ]);
    const findings = doubleSpaceAfterPeriodCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.suggestedText).toBe("First sentence. Second sentence.");
  });

  it("does not flag a single space after a period", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "First. Second. Third."),
    ]);
    expect(doubleSpaceAfterPeriodCheck.run(adapter, null, { mode: "destructive" })).toHaveLength(0);
  });

  it("returns empty when mode is 'off'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "A.  B.")]);
    expect(doubleSpaceAfterPeriodCheck.run(adapter, null, { mode: "off" })).toHaveLength(0);
  });
});
