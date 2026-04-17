import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { citationFormatCheck } from "../../../../src/proofmark/engine/checks/citation-format";

describe("citation-format check", () => {
  it("flags mixed use of '\u00a7' and 'Sec.' in the same doc", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "See \u00a7 12(a) of the Act."),
      FakeDocumentAdapter.makeParagraph("p2", "As set forth in Sec. 14."),
    ]);
    const findings = citationFormatCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.some((f) => f.message.toLowerCase().includes("inconsistent"))).toBe(true);
  });

  it("flags double-space inside a citation", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Smith  v.  Jones, 123 U.S. 456."),
    ]);
    const findings = citationFormatCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.some((f) => f.message.toLowerCase().includes("double"))).toBe(true);
  });

  it("does not flag a clean citation", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Smith v. Jones, 123 U.S. 456 (1999)."),
    ]);
    expect(citationFormatCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });
});
