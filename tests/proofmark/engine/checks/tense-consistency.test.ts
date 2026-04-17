import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { tenseConsistencyCheck } from "../../../../src/proofmark/engine/checks/tense-consistency";
import type { Region } from "../../../../src/proofmark/engine/types";

describe("tense-consistency check", () => {
  it("flags a past-tense paragraph in a present-tense region", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Seller is responsible for delivery."),
      FakeDocumentAdapter.makeParagraph("p2", "Buyer shall pay promptly."),
      FakeDocumentAdapter.makeParagraph("p3", "The parties were previously in discussions."),
    ]);
    const region: Region = {
      name: "recitals",
      range: [
        { id: "p1", kind: "paragraph" },
        { id: "p2", kind: "paragraph" },
        { id: "p3", kind: "paragraph" },
      ],
      confidence: "high",
      confirmed: true,
    };
    const findings = tenseConsistencyCheck.run(adapter, region, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.map((f) => f.range.id)).toContain("p3");
  });

  it("does not flag a region in a consistent tense", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Seller is the owner."),
      FakeDocumentAdapter.makeParagraph("p2", "Buyer shall pay."),
    ]);
    const region: Region = {
      name: "recitals",
      range: [
        { id: "p1", kind: "paragraph" },
        { id: "p2", kind: "paragraph" },
      ],
      confidence: "high",
      confirmed: true,
    };
    expect(tenseConsistencyCheck.run(adapter, region, { mode: "interactive" })).toHaveLength(0);
  });

  it("no-ops when invoked with null region (doc-global call)", () => {
    const adapter = new FakeDocumentAdapter([]);
    expect(tenseConsistencyCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });
});
