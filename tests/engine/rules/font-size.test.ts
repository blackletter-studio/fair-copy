import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { fontSizeRule } from "../../../src/engine/rules/font-size";

describe("font-size rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "hi")]);
    void fontSizeRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets all body runs to target size when mode is 'one-body-size'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "body")]);
    void fontSizeRule.apply(adapter, {
      mode: "one-body-size",
      targetPt: 11,
      preserveHeadings: true,
    });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toEqual({ fontSize: 11 });
  });

  it("preserves headings when preserveHeadings is true", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "h", { paragraphFormat: { styleName: "Heading 2" } }),
      FakeDocumentAdapter.makeParagraph("p2", "body"),
    ]);
    void fontSizeRule.apply(adapter, {
      mode: "one-body-size",
      targetPt: 11,
      preserveHeadings: true,
    });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.ref?.id).toBe("p2-run-0");
  });
});
