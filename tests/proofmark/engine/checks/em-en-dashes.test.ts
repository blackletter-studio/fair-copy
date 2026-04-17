import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { emEnDashesCheck } from "../../../../src/proofmark/engine/checks/em-en-dashes";

describe("em-en-dashes check", () => {
  it("suggests em-dash for ' - ' between words", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Counsel argued - the court disagreed."),
    ]);
    const findings = emEnDashesCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.suggestedText).toBe("Counsel argued\u2009\u2014\u2009the court disagreed.");
  });

  it("suggests en-dash for numeric ranges like '1990 - 1995'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "See 1990 - 1995 decisions."),
    ]);
    const findings = emEnDashesCheck.run(adapter, null, { mode: "destructive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.suggestedText).toBe("See 1990\u20131995 decisions.");
  });

  it("does not flag a paragraph that already uses em-dash", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Ruling\u2014clear."),
    ]);
    expect(emEnDashesCheck.run(adapter, null, { mode: "destructive" })).toHaveLength(0);
  });

  it("returns empty when mode is 'off'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "a - b")]);
    expect(emEnDashesCheck.run(adapter, null, { mode: "off" })).toHaveLength(0);
  });
});
