import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { numberedListsRule } from "../../../src/engine/rules/numbered-lists";

function numItem(id: string) {
  return FakeDocumentAdapter.makeParagraph(id, "item", { listInfo: { type: "number", level: 1 } });
}

describe("numbered-lists rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([numItem("p1")]);
    void numberedListsRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("normalizes style when mode is 'normalize'", () => {
    const adapter = new FakeDocumentAdapter([numItem("p1"), numItem("p2")]);
    void numberedListsRule.apply(adapter, { mode: "normalize" });
    const muts = adapter.mutationsFor("setListStyle");
    expect(muts).toHaveLength(2);
    expect(muts[0]?.payload).toEqual({ type: "number", markerStyle: "simple", level: 1 });
  });

  it("ignores bullet items", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "b", { listInfo: { type: "bullet", level: 1 } }),
    ]);
    void numberedListsRule.apply(adapter, { mode: "normalize" });
    expect(adapter.mutationsFor("setListStyle")).toHaveLength(0);
  });

  it("strips list styling when mode is 'strip'", () => {
    const adapter = new FakeDocumentAdapter([numItem("p1")]);
    void numberedListsRule.apply(adapter, { mode: "strip" });
    expect(adapter.mutationsFor("setListStyle")[0]?.payload).toBeNull();
  });
});
