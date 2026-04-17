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

describe("detectRegions — recitals", () => {
  it("detects a run of paragraphs starting with 'WHEREAS,'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "WHEREAS, the parties desire..."),
      FakeDocumentAdapter.makeParagraph("p2", "WHEREAS, Buyer agrees..."),
      FakeDocumentAdapter.makeParagraph("p3", "NOW, THEREFORE, it is agreed:"),
    ]);
    const regions = detectRegions(adapter);
    const recitals = regions.find((r) => r.name === "recitals");
    expect(recitals).toBeDefined();
    expect(recitals?.range.map((r) => r.id)).toEqual(["p1", "p2"]);
    expect(recitals?.confidence).toBe("high");
  });

  it("detects recitals under a 'Recitals' heading", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("h1", "Recitals", { headingStyle: "heading-1" }),
      FakeDocumentAdapter.makeParagraph("p1", "The parties entered into..."),
      FakeDocumentAdapter.makeParagraph("p2", "They now wish to restate..."),
      FakeDocumentAdapter.makeParagraph("h2", "Agreement", { headingStyle: "heading-1" }),
    ]);
    const regions = detectRegions(adapter);
    const recitals = regions.find((r) => r.name === "recitals");
    expect(recitals).toBeDefined();
    expect(recitals?.range.map((r) => r.id)).toEqual(["p1", "p2"]);
  });

  it("does not flag a normal paragraph", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Normal sentence."),
    ]);
    expect(detectRegions(adapter).find((r) => r.name === "recitals")).toBeUndefined();
  });
});

describe("detectRegions — definitions", () => {
  it("detects definitions under a 'Definitions' heading", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("h1", "Definitions", { headingStyle: "heading-1" }),
      FakeDocumentAdapter.makeParagraph("p1", '"Agreement" means this document.'),
      FakeDocumentAdapter.makeParagraph("p2", '"Party" shall mean either signatory.'),
      FakeDocumentAdapter.makeParagraph("h2", "Term", { headingStyle: "heading-1" }),
    ]);
    const regions = detectRegions(adapter);
    const defs = regions.find((r) => r.name === "definitions");
    expect(defs).toBeDefined();
    expect(defs?.range.map((r) => r.id)).toEqual(["p1", "p2"]);
  });

  it("detects orphaned definition-pattern paragraphs even without a heading", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Normal sentence."),
      FakeDocumentAdapter.makeParagraph("p2", '"Buyer" means ABC Corp.'),
    ]);
    const regions = detectRegions(adapter);
    const defs = regions.find((r) => r.name === "definitions");
    expect(defs).toBeDefined();
    expect(defs?.range.map((r) => r.id)).toContain("p2");
    expect(defs?.confidence).toBe("medium");
  });

  it("does not flag unrelated paragraphs", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "The meaning of life is unclear."),
    ]);
    expect(detectRegions(adapter).find((r) => r.name === "definitions")).toBeUndefined();
  });
});
