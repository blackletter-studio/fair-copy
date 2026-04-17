import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { boldItalicUnderlineRule } from "../../../src/engine/rules/bold-italic-underline";

function paraWithBold() {
  return FakeDocumentAdapter.makeParagraph("p1", "hi", {
    runs: [
      {
        ref: { id: "r1", kind: "run" },
        text: "hi",
        format: { bold: true, italic: true, underline: true },
      },
    ],
  });
}

describe("bold-italic-underline rule", () => {
  it("is a no-op when all three are 'keep' (default)", () => {
    const adapter = new FakeDocumentAdapter([paraWithBold()]);
    void boldItalicUnderlineRule.apply(adapter, {
      bold: "keep",
      italic: "keep",
      underline: "keep",
    });
    expect(adapter.mutations).toEqual([]);
  });

  it("strips bold when bold='strip'", () => {
    const adapter = new FakeDocumentAdapter([paraWithBold()]);
    void boldItalicUnderlineRule.apply(adapter, {
      bold: "strip",
      italic: "keep",
      underline: "keep",
    });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toEqual({ bold: false });
  });

  it("strips italic when italic='strip'", () => {
    const adapter = new FakeDocumentAdapter([paraWithBold()]);
    void boldItalicUnderlineRule.apply(adapter, {
      bold: "keep",
      italic: "strip",
      underline: "keep",
    });
    expect(adapter.mutationsFor("setTextFormat")[0]?.payload).toEqual({ italic: false });
  });

  it("strips all three when all are 'strip'", () => {
    const adapter = new FakeDocumentAdapter([paraWithBold()]);
    void boldItalicUnderlineRule.apply(adapter, {
      bold: "strip",
      italic: "strip",
      underline: "strip",
    });
    const muts = adapter.mutationsFor("setTextFormat");
    expect(muts).toHaveLength(1);
    expect(muts[0]?.payload).toEqual({ bold: false, italic: false, underline: false });
  });
});
