import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { lineSpacingRule, ASSUMED_BODY_POINTS } from "../../../src/engine/rules/line-spacing";

describe("line-spacing rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void lineSpacingRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets lineSpacing in points (ratio * assumed body size) when mode is 'set'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "a"),
      FakeDocumentAdapter.makeParagraph("p2", "b"),
    ]);
    void lineSpacingRule.apply(adapter, { mode: "set", targetRatio: 1.15 });
    const muts = adapter.mutationsFor("setParagraphFormat");
    expect(muts).toHaveLength(2);
    // Word.Paragraph.lineSpacing is in POINTS, not a ratio. 1.15 * 11pt = 12.65pt.
    expect(muts[0]?.payload).toEqual({ lineSpacing: 1.15 * ASSUMED_BODY_POINTS });
  });
});
