import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { highlightingRule } from "../../../src/engine/rules/highlighting";

describe("highlighting rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void highlightingRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("clears highlight on all runs when mode is 'remove'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "yellow", {
        runs: [{ ref: { id: "r1", kind: "run" }, text: "yellow", format: { highlight: "yellow" } }],
      }),
    ]);
    void highlightingRule.apply(adapter, { mode: "remove" });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toEqual({ highlight: null });
  });
});
