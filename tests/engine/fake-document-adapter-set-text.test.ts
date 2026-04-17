import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../src/engine/fake-document-adapter";

describe("FakeDocumentAdapter.setParagraphText", () => {
  it("records a setParagraphText mutation with the ref and new text", () => {
    const p = FakeDocumentAdapter.makeParagraph("p1", "old text");
    const adapter = new FakeDocumentAdapter([p]);
    adapter.setParagraphText(p.ref, "new text");
    const muts = adapter.mutationsFor("setParagraphText");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.ref).toEqual(p.ref);
    expect(muts[0]?.payload).toBe("new text");
  });

  it("updates the paragraph's in-memory text so subsequent reads see the change", () => {
    const p = FakeDocumentAdapter.makeParagraph("p1", "old");
    const adapter = new FakeDocumentAdapter([p]);
    adapter.setParagraphText(p.ref, "new");
    expect(adapter.getAllParagraphs()[0]?.text).toBe("new");
  });
});
