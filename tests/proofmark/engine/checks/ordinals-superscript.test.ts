import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { ordinalsSuperscriptCheck } from "../../../../src/proofmark/engine/checks/ordinals-superscript";

describe("ordinals-superscript check", () => {
  it("flags '1st'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "The 1st circuit held."),
    ]);
    const findings = ordinalsSuperscriptCheck.run(adapter, null, { mode: "interactive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.metadata).toMatchObject({ ordinal: "1st" });
  });

  it("flags multiple ordinals in one paragraph", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "2nd, 3rd, and 4th claims."),
    ]);
    expect(ordinalsSuperscriptCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(1);
  });

  it("does not flag plain numbers", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Paid 100 dollars."),
    ]);
    expect(ordinalsSuperscriptCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("is interactive by default", () => {
    expect(ordinalsSuperscriptCheck.defaultMode).toBe("interactive");
  });

  it("returns empty when mode is 'off'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "1st")]);
    expect(ordinalsSuperscriptCheck.run(adapter, null, { mode: "off" })).toHaveLength(0);
  });
});
