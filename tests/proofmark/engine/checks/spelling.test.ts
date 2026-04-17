import { describe, it, expect, beforeEach } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { runSpelling, spellingCheck } from "../../../../src/proofmark/engine/checks/spelling";
import { resetCheckerCache } from "../../../../src/proofmark/engine/spelling/spell-checker";

beforeEach(() => {
  resetCheckerCache();
});

describe("runSpelling — back-compat guard", () => {
  it("returns [] when adapter lacks getProofingErrorRanges", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (adapter as any).getProofingErrorRanges;
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("runSpelling — empty proofing errors", () => {
  it("returns [] when Word reports no proofing errors", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "This sentence is fine."),
    ]);
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("runSpelling — single-word vs multi-word classification", () => {
  it("emits a spelling finding for a single-word proofing error", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.checkName).toBe("spelling");
    expect(findings[0]!.region).toBe("document");
    expect(findings[0]!.metadata?.word).toBe("wittnes");
  });

  it("skips multi-word proofing errors (grammar owns those)", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
    ]);
    // "there their" is a multi-word grammar issue; spelling should ignore it.
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "there their", offset: 10, length: 11 }]);
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(0);
  });

  it("handles multiple single-word errors across paragraphs", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
      FakeDocumentAdapter.makeParagraph("para-1", "The defendent was absent."),
    ]);
    adapter.setProofingErrors([
      { paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 },
      { paragraphIndex: 1, text: "defendent", offset: 4, length: 9 },
    ]);
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.metadata?.word).sort()).toEqual(["defendent", "wittnes"]);
  });
});

describe("runSpelling — custom dictionary suppression", () => {
  it("suppresses a flagged word that's in the custom dict", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The xyzfoo clause applies."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "xyzfoo", offset: 4, length: 6 }]);
    const findings = await runSpelling(adapter, ["xyzfoo"]);
    expect(findings).toHaveLength(0);
  });

  it("suppression is case-insensitive", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The XyzFoo clause applies."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "XyzFoo", offset: 4, length: 6 }]);
    const findings = await runSpelling(adapter, ["xyzfoo"]);
    expect(findings).toHaveLength(0);
  });

  it("does NOT suppress words NOT in the custom dict", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runSpelling(adapter, ["different-word"]);
    expect(findings).toHaveLength(1);
  });
});

describe("runSpelling — finding shape", () => {
  it("encodes a spell-ref in the finding range id", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runSpelling(adapter, []);
    expect(findings[0]!.range.id).toMatch(/^spell-\d+-\d+-\d+$/);
    expect(findings[0]!.range.kind).toBe("run");
  });

  it("uses info severity and medium confidence", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runSpelling(adapter, []);
    expect(findings[0]!.severity).toBe("info");
    expect(findings[0]!.confidence).toBe("medium");
  });

  it("populates suggestedText from nspell when suggestions exist", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runSpelling(adapter, []);
    // Don't assert the exact suggestion — nspell's ranking is its business —
    // just that something usable came back.
    expect(findings[0]!.suggestedText).toBeDefined();
    expect((findings[0]!.metadata!.suggestions as string[]).length).toBeGreaterThan(0);
  });

  it("skips errors whose paragraph index is out of range", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Hello world."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 99, text: "wittnes", offset: 0, length: 7 }]);
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("spellingCheck (synchronous Check interface)", () => {
  it("run() returns [] — async work is done by runSpelling separately", () => {
    const adapter = new FakeDocumentAdapter([]);
    const results = spellingCheck.run(adapter, null, { mode: "interactive" });
    expect(results).toHaveLength(0);
  });

  it("apply() calls replaceRange when finding has suggestedText", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runSpelling(adapter, []);
    expect(findings[0]!.suggestedText).toBeDefined();
    spellingCheck.apply(adapter, findings[0]!);
    const muts = adapter.mutationsFor("replaceRange");
    expect(muts).toHaveLength(1);
    expect(muts[0]!.ref?.id).toBe(findings[0]!.range.id);
    expect(muts[0]!.payload).toBe(findings[0]!.suggestedText);
  });

  it("apply() is a no-op when finding has no suggestedText", () => {
    const adapter = new FakeDocumentAdapter([]);
    const finding = {
      id: "test",
      checkName: "spelling" as const,
      region: "document" as const,
      range: { id: "spell-0-4-7", kind: "run" as const },
      excerpt: "test",
      severity: "info" as const,
      confidence: "medium" as const,
      message: "Unknown word.",
    };
    spellingCheck.apply(adapter, finding);
    expect(adapter.mutations).toHaveLength(0);
  });
});
