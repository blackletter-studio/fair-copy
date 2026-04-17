import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../src/engine/fake-document-adapter";

describe("FakeDocumentAdapter.getHeadingStyle", () => {
  it("returns null for a paragraph without a heading style", () => {
    const p = FakeDocumentAdapter.makeParagraph("p1", "body text");
    const adapter = new FakeDocumentAdapter([p]);
    expect(adapter.getHeadingStyle(p.ref)).toBeNull();
  });

  it("returns the configured heading level from overrides", () => {
    const h1 = FakeDocumentAdapter.makeParagraph("p-h1", "Definitions", {
      headingStyle: "heading-1",
    });
    const title = FakeDocumentAdapter.makeParagraph("p-title", "AGREEMENT", {
      headingStyle: "title",
    });
    const body = FakeDocumentAdapter.makeParagraph("p-body", "some text");
    const adapter = new FakeDocumentAdapter([h1, title, body]);
    expect(adapter.getHeadingStyle(h1.ref)).toBe("heading-1");
    expect(adapter.getHeadingStyle(title.ref)).toBe("title");
    expect(adapter.getHeadingStyle(body.ref)).toBeNull();
  });

  it("returns null for a ref not present in the adapter", () => {
    const adapter = new FakeDocumentAdapter([]);
    expect(adapter.getHeadingStyle({ id: "missing", kind: "paragraph" })).toBeNull();
  });
});
