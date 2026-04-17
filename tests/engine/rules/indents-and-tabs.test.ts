import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { indentsAndTabsRule } from "../../../src/engine/rules/indents-and-tabs";

describe("indents-and-tabs rule", () => {
  it("keeps indents on block-quote styled paragraphs", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph(
        "p1",
        "a long quote from some decision here, more than eighty chars easily, plenty of text.",
        { paragraphFormat: { styleName: "Quote", leftIndent: 36 } },
      ),
    ]);
    void indentsAndTabsRule.apply(adapter, { mode: "normalize" });
    expect(adapter.mutationsFor("setParagraphFormat")).toHaveLength(0);
  });

  it("keeps indents on list items", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "item text", {
        paragraphFormat: { leftIndent: 24 },
        listInfo: { type: "bullet", level: 1 },
      }),
    ]);
    void indentsAndTabsRule.apply(adapter, { mode: "normalize" });
    expect(adapter.mutationsFor("setParagraphFormat")).toHaveLength(0);
  });

  it("normalizes arbitrary indents on short paragraphs", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "short", { paragraphFormat: { leftIndent: 72 } }),
    ]);
    void indentsAndTabsRule.apply(adapter, { mode: "normalize" });
    const muts = adapter.mutationsFor("setParagraphFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toEqual({ leftIndent: 0, firstLineIndent: 0 });
  });

  it("keeps first-line indent on long body paragraphs (structural)", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph(
        "p1",
        "This is a body paragraph that is definitely longer than eighty characters and has a first-line indent like a brief.",
        { paragraphFormat: { firstLineIndent: 36 } },
      ),
    ]);
    void indentsAndTabsRule.apply(adapter, { mode: "normalize" });
    expect(adapter.mutationsFor("setParagraphFormat")).toHaveLength(0);
  });

  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "x", { paragraphFormat: { leftIndent: 72 } }),
    ]);
    void indentsAndTabsRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });
});
