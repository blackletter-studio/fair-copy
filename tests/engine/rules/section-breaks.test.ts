import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { sectionBreaksRule } from "../../../src/engine/rules/section-breaks";

describe("section-breaks rule", () => {
  it("calls removeSectionBreaks when mode is 'strip'", () => {
    const adapter = new FakeDocumentAdapter();
    void sectionBreaksRule.apply(adapter, { mode: "strip" });
    expect(adapter.mutationsFor("removeSectionBreaks")).toHaveLength(1);
  });

  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter();
    void sectionBreaksRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });
});
