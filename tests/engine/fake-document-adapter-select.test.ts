import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../src/engine/fake-document-adapter";

describe("FakeDocumentAdapter.selectRange", () => {
  it("records a selectRange mutation with the given ref", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Some text."),
    ]);
    const ref = { id: "para-0", kind: "paragraph" as const };
    adapter.selectRange(ref);
    const mutations = adapter.mutationsFor("selectRange");
    expect(mutations).toHaveLength(1);
    expect(mutations[0]?.ref).toEqual(ref);
  });
});
