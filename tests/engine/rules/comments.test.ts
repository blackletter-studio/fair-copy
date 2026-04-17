import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { commentsRule } from "../../../src/engine/rules/comments";

describe("comments rule", () => {
  it("calls removeComments when mode is 'strip'", () => {
    const adapter = new FakeDocumentAdapter();
    void commentsRule.apply(adapter, { mode: "strip" });
    expect(adapter.mutationsFor("removeComments")).toHaveLength(1);
  });

  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter();
    void commentsRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });
});
