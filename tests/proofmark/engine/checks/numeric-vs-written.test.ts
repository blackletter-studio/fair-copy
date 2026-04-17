import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { numericVsWrittenCheck } from "../../../../src/proofmark/engine/checks/numeric-vs-written";

describe("numeric-vs-written check", () => {
  it("flags inconsistent use of 'five' and '5'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "There are five defendants."),
      FakeDocumentAdapter.makeParagraph("p2", "Only 5 responded."),
    ]);
    const findings = numericVsWrittenCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
  });

  it("does not flag when all small numbers are written", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Three, four, or five parties."),
    ]);
    expect(numericVsWrittenCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("does not flag numbers >= 10", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "There were 15 parties."),
    ]);
    expect(numericVsWrittenCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });
});
