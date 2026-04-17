import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { tablesRule } from "../../../src/engine/rules/tables";

describe("tables rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void tablesRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("is a no-op when mode is 'normalize' and no tables (stub for M2 T8 integration)", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void tablesRule.apply(adapter, { mode: "normalize" });
    expect(adapter.mutations).toEqual([]);
  });

  it("throws for unsupported 'convert' mode", () => {
    const adapter = new FakeDocumentAdapter();
    expect(() => tablesRule.apply(adapter, { mode: "convert" })).toThrow(/not supported/);
  });
});
