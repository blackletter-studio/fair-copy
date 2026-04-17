import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { bulletListsRule } from "../../../src/engine/rules/bullet-lists";

function bulletItem(id: string) {
  return FakeDocumentAdapter.makeParagraph(id, "item", { listInfo: { type: "bullet", level: 1 } });
}

describe("bullet-lists rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([bulletItem("p1")]);
    void bulletListsRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("normalizes bullet style on every bullet item when mode is 'normalize'", () => {
    const adapter = new FakeDocumentAdapter([bulletItem("p1"), bulletItem("p2")]);
    void bulletListsRule.apply(adapter, { mode: "normalize" });
    const muts = adapter.mutationsFor("setListStyle");
    expect(muts).toHaveLength(2);
    expect(muts[0]?.payload).toEqual({ type: "bullet", markerStyle: "simple", level: 1 });
  });

  it("ignores numbered list items (they're handled by the numbered-lists rule)", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "num", { listInfo: { type: "number", level: 1 } }),
    ]);
    void bulletListsRule.apply(adapter, { mode: "normalize" });
    expect(adapter.mutationsFor("setListStyle")).toHaveLength(0);
  });

  it("strips list styling when mode is 'strip' (sets style to null)", () => {
    const adapter = new FakeDocumentAdapter([bulletItem("p1")]);
    void bulletListsRule.apply(adapter, { mode: "strip" });
    const muts = adapter.mutationsFor("setListStyle");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toBeNull();
  });
});
