import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { detectRegions } from "../../../src/proofmark/engine/region-detector";

describe("detectRegions", () => {
  it("returns an empty array for an empty document", () => {
    const adapter = new FakeDocumentAdapter([]);
    expect(detectRegions(adapter)).toEqual([]);
  });

  it("returns an empty array when no known region patterns match", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Some body text."),
      FakeDocumentAdapter.makeParagraph("p2", "More body text."),
    ]);
    expect(detectRegions(adapter)).toEqual([]);
  });
});
