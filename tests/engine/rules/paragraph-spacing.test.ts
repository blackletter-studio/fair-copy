import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { paragraphSpacingRule } from "../../../src/engine/rules/paragraph-spacing";

describe("paragraph-spacing rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void paragraphSpacingRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets spaceBefore + spaceAfter on every paragraph when mode is 'consistent'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "a")]);
    void paragraphSpacingRule.apply(adapter, { mode: "consistent", beforePt: 0, afterPt: 6 });
    const muts = adapter.mutationsFor("setParagraphFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toEqual({ spaceBefore: 0, spaceAfter: 6 });
  });
});
