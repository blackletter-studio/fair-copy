import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { straightQuotesCheck } from "../../../../src/proofmark/engine/checks/straight-quotes";

describe("straight-quotes check", () => {
  it("flags a paragraph containing a straight double quote", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello" to the court.'),
    ]);
    const findings = straightQuotesCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.checkName).toBe("straight-quotes");
    expect(findings[0]?.suggestedText).toBe("He said \u201chello\u201d to the court.");
  });

  it("flags a paragraph containing a straight apostrophe", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "It's the plaintiff's counsel."),
    ]);
    const findings = straightQuotesCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.suggestedText).toBe("It\u2019s the plaintiff\u2019s counsel.");
  });

  it("does not flag a paragraph with only curly quotes", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "\u201cClean\u201d text."),
    ]);
    const findings = straightQuotesCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(0);
  });

  it("returns empty array when mode is 'off'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", 'x"y')]);
    const findings = straightQuotesCheck.run(adapter, null, { mode: "off" });
    expect(findings).toHaveLength(0);
  });

  it("apply() writes the suggested text via setParagraphText", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hi"'),
    ]);
    const findings = straightQuotesCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    if (!finding) throw new Error("expected finding");
    straightQuotesCheck.apply(adapter, finding);
    const muts = adapter.mutationsFor("setParagraphText");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toBe("He said \u201chi\u201d");
  });
});
