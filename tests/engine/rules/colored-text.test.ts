import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { coloredTextRule } from "../../../src/engine/rules/colored-text";

describe("colored-text rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    void coloredTextRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("sets all run fontColors to ink black when mode is 'convert-to-black'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "red", {
        runs: [{ ref: { id: "r1", kind: "run" }, text: "red", format: { fontColor: "#ff0000" } }],
      }),
      FakeDocumentAdapter.makeParagraph("p2", "normal"),
    ]);
    void coloredTextRule.apply(adapter, { mode: "convert-to-black" });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(2);
    expect(muts[0]?.payload).toEqual({ fontColor: "#1a1a1a" });
  });
});
