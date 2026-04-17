import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { orphanHeadingCheck } from "../../../../src/proofmark/engine/checks/orphan-heading";

describe("orphan-heading check", () => {
  it("flags a heading immediately followed by another heading", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("h1", "Article I", { headingStyle: "heading-1" }),
      FakeDocumentAdapter.makeParagraph("h2", "Section 1.1", { headingStyle: "heading-2" }),
      FakeDocumentAdapter.makeParagraph("p1", "Body text."),
    ]);
    const findings = orphanHeadingCheck.run(adapter, null, { mode: "interactive" });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.range.id).toBe("h1");
  });

  it("does not flag when body follows the heading", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("h1", "Article I", { headingStyle: "heading-1" }),
      FakeDocumentAdapter.makeParagraph("p1", "Body."),
    ]);
    expect(orphanHeadingCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("does not flag the final paragraph of the doc", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Body."),
      FakeDocumentAdapter.makeParagraph("h1", "End", { headingStyle: "heading-1" }),
    ]);
    expect(orphanHeadingCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });
});
