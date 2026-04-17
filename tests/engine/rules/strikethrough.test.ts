import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { strikethroughRule } from "../../../src/engine/rules/strikethrough";

describe("strikethrough rule", () => {
  it("is a no-op when mode is 'keep' (default)", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void strikethroughRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets strikethrough=false on all runs when mode is 'strip'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "x"),
      FakeDocumentAdapter.makeParagraph("p2", "y"),
    ]);
    void strikethroughRule.apply(adapter, { mode: "strip" });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(2);
    expect(muts[0]?.payload).toEqual({ strikethrough: false });
  });
});
