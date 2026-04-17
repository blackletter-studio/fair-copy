import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { alignmentRule } from "../../../src/engine/rules/alignment";

describe("alignment rule", () => {
  it("is a no-op when mode is 'keep' (default)", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void alignmentRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets alignment on every paragraph when mode is 'set'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "a"),
      FakeDocumentAdapter.makeParagraph("p2", "b"),
    ]);
    void alignmentRule.apply(adapter, { mode: "set", target: "left" });
    const muts = adapter.mutationsFor("setParagraphFormat");
    expect(muts).toHaveLength(2);
    expect(muts[0]?.payload).toEqual({ alignment: "left" });
  });
});
