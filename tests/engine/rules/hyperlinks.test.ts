import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { hyperlinksRule } from "../../../src/engine/rules/hyperlinks";
import type { HyperlinkInfo } from "../../../src/engine/types";

describe("hyperlinks rule", () => {
  it("is a no-op when mode is 'keep'", () => {
    const adapter = new FakeDocumentAdapter();
    adapter.setHyperlinks([
      { ref: { id: "h1", kind: "run" }, url: "https://example.com", text: "example" },
    ]);
    void hyperlinksRule.apply(adapter, { mode: "keep" });
    expect(adapter.mutations).toEqual([]);
  });

  it("does not call stripHyperlinkFormatting when there are no hyperlinks", () => {
    const adapter = new FakeDocumentAdapter();
    void hyperlinksRule.apply(adapter, { mode: "strip-formatting" });
    expect(adapter.mutationsFor("stripHyperlinkFormatting")).toHaveLength(0);
  });

  it("calls stripHyperlinkFormatting once per hyperlink in 'strip-formatting' mode", () => {
    const adapter = new FakeDocumentAdapter();
    const links: HyperlinkInfo[] = [
      { ref: { id: "h1", kind: "run" }, url: "https://a.test", text: "a" },
      { ref: { id: "h2", kind: "run" }, url: "https://b.test", text: "b" },
    ];
    adapter.setHyperlinks(links);
    void hyperlinksRule.apply(adapter, { mode: "strip-formatting" });
    expect(adapter.mutationsFor("stripHyperlinkFormatting")).toHaveLength(2);
  });

  it("throws for unsupported 'strip-entirely' mode", () => {
    const adapter = new FakeDocumentAdapter();
    expect(() => hyperlinksRule.apply(adapter, { mode: "strip-entirely" })).toThrow(
      "Rule 'hyperlinks': mode 'strip-entirely' not supported in v1.0.",
    );
  });
});
