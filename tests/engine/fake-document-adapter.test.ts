import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../src/engine/fake-document-adapter";

describe("FakeDocumentAdapter", () => {
  it("starts with empty paragraphs and no mutations", () => {
    const adapter = new FakeDocumentAdapter();
    expect(adapter.getAllParagraphs()).toEqual([]);
    expect(adapter.mutations).toEqual([]);
    expect(adapter.committed).toBe(false);
  });

  it("records setTextFormat mutations", () => {
    const adapter = new FakeDocumentAdapter();
    const ref = { id: "r1", kind: "run" as const };
    adapter.setTextFormat(ref, { fontName: "IBM Plex Sans" });
    expect(adapter.mutations).toHaveLength(1);
    expect(adapter.mutations[0]).toEqual({
      op: "setTextFormat",
      ref,
      payload: { fontName: "IBM Plex Sans" },
    });
  });

  it("marks committed=true after commit()", async () => {
    const adapter = new FakeDocumentAdapter();
    await adapter.commit();
    expect(adapter.committed).toBe(true);
  });

  it("seeds paragraphs via makeParagraph helper", () => {
    const p = FakeDocumentAdapter.makeParagraph("p1", "Hello world");
    expect(p.ref.id).toBe("p1");
    expect(p.ref.kind).toBe("paragraph");
    expect(p.text).toBe("Hello world");
    expect(p.runs).toHaveLength(1);
    expect(p.runs[0]?.text).toBe("Hello world");
  });

  it("filters mutations by op", () => {
    const adapter = new FakeDocumentAdapter();
    adapter.setTextFormat({ id: "r1", kind: "run" }, { bold: true });
    adapter.setParagraphFormat({ id: "p1", kind: "paragraph" }, { alignment: "left" });
    adapter.removeComments();
    expect(adapter.mutationsFor("setTextFormat")).toHaveLength(1);
    expect(adapter.mutationsFor("setParagraphFormat")).toHaveLength(1);
    expect(adapter.mutationsFor("removeComments")).toHaveLength(1);
  });
});
