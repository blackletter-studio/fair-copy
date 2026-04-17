import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { fontFaceRule } from "../../../src/engine/rules/font-face";

describe("font-face rule", () => {
  it("is a no-op when setting is keep-as-is", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "hello")]);
    void fontFaceRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets every run's fontName to target when mode is 'change'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "hello"),
      FakeDocumentAdapter.makeParagraph("p2", "world"),
    ]);
    void fontFaceRule.apply(adapter, { mode: "change", target: "Times New Roman" });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(2);
    expect(muts[0]?.payload).toEqual({ fontName: "Times New Roman" });
    expect(muts[1]?.payload).toEqual({ fontName: "Times New Roman" });
  });

  it("preserves heading-style paragraphs when preserveHeadings is true", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "heading", {
        paragraphFormat: { styleName: "Heading 1" },
      }),
      FakeDocumentAdapter.makeParagraph("p2", "body"),
    ]);
    void fontFaceRule.apply(adapter, {
      mode: "change",
      target: "Times New Roman",
      preserveHeadings: true,
    });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.ref?.id).toBe("p2-run-0");
  });
});
