import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { partyNameConsistencyCheck } from "../../../../src/proofmark/engine/checks/party-name-consistency";

describe("party-name-consistency check", () => {
  it("flags inconsistent entity suffix", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph(
        "p1",
        'This Agreement is between ABC Corp. ("Seller") and XYZ LLC.',
      ),
      FakeDocumentAdapter.makeParagraph("p2", "ABC Corporation will deliver the goods."),
    ]);
    const findings = partyNameConsistencyCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.message).toContain("ABC");
  });

  it("does not flag consistent usage", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph(
        "p1",
        'This Agreement is between ABC Corp. ("Seller") and XYZ LLC.',
      ),
      FakeDocumentAdapter.makeParagraph("p2", "ABC Corp. will deliver the goods."),
    ]);
    expect(partyNameConsistencyCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("is interactive by default", () => {
    expect(partyNameConsistencyCheck.defaultMode).toBe("interactive");
  });

  it("produces suggestedText replacing the variant with canonical", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph(
        "p1",
        'This Agreement is between ABC Corp. ("Seller") and XYZ LLC.',
      ),
      FakeDocumentAdapter.makeParagraph("p2", "ABC Corporation will deliver the goods."),
    ]);
    const findings = partyNameConsistencyCheck.run(adapter, null, { mode: "interactive" });
    expect(findings[0]?.suggestedText).toBe("ABC Corp. will deliver the goods.");
  });
});
