import { describe, it, expect, beforeEach } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { runGrammar, grammarCheck } from "../../../../src/proofmark/engine/checks/grammar";
import { resetCheckerCache } from "../../../../src/proofmark/engine/spelling/spell-checker";

beforeEach(() => {
  resetCheckerCache();
});

describe("runGrammar — back-compat guard", () => {
  it("returns [] when adapter lacks getProofingErrorRanges", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "There is an issue."),
    ]);
    // Remove the method to simulate an older adapter.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (adapter as any).getProofingErrorRanges;
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("runGrammar — empty proofing errors", () => {
  it("returns [] when host reports no proofing errors", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "This sentence is fine."),
    ]);
    // setProofingErrors already defaults to [] — no call needed.
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("runGrammar — spelling vs. grammar split", () => {
  it("filters out errors whose text is also flagged by nspell (spelling owns them)", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    // "wittnes" is a misspelling — nspell will flag it, so grammar should skip it.
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });

  it("emits a grammar finding for errors whose text passes nspell", async () => {
    // "there their" — both valid words individually, but Word might flag the
    // combination as a grammar error. nspell won't flag either word alone.
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
    ]);
    // Word flags "there" in context as a grammar error (wrong word choice).
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "there", offset: 10, length: 5 }]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.checkName).toBe("grammar");
    expect(findings[0]!.region).toBe("document");
    expect(findings[0]!.severity).toBe("info");
    expect(findings[0]!.confidence).toBe("medium");
    expect(findings[0]!.message).toMatch(/grammar/i);
  });

  it("grammar finding carries correct id, range, and metadata", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "there", offset: 10, length: 5 }]);
    const findings = await runGrammar(adapter, []);
    const f = findings[0]!;
    // id encodes checkName + paragraph ref + offset
    expect(f.id).toBe("grammar::para-0::10");
    // range re-uses spell- convention so selectRange/replaceRange can address it
    expect(f.range.id).toBe("spell-0-10-5");
    expect(f.range.kind).toBe("run");
    expect(f.metadata).toMatchObject({ word: "there", offset: 10 });
  });

  it("skips errors for paragraph indexes that have no matching paragraph", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Hello world."),
    ]);
    // paragraphIndex 99 doesn't exist in the adapter.
    adapter.setProofingErrors([{ paragraphIndex: 99, text: "world", offset: 6, length: 5 }]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });

  it("handles multiple grammar errors across different paragraphs", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
      FakeDocumentAdapter.makeParagraph("para-1", "Its a problem that its late."),
    ]);
    adapter.setProofingErrors([
      { paragraphIndex: 0, text: "there", offset: 10, length: 5 },
      { paragraphIndex: 1, text: "Its", offset: 0, length: 3 },
    ]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(2);
    expect(findings[0]!.id).toBe("grammar::para-0::10");
    expect(findings[1]!.id).toBe("grammar::para-1::0");
  });
});

describe("grammarCheck (synchronous Check interface)", () => {
  it("run() returns [] — async work is done by runGrammar separately", () => {
    const adapter = new FakeDocumentAdapter([]);
    const results = grammarCheck.run(adapter, null, { mode: "interactive" });
    expect(results).toHaveLength(0);
  });

  it("apply() is a no-op — grammar findings require manual correction", () => {
    const adapter = new FakeDocumentAdapter([]);
    const finding = {
      id: "grammar::para-0::10",
      checkName: "grammar" as const,
      region: "document" as const,
      range: { id: "spell-0-10-5", kind: "run" as const },
      excerpt: "…there their car…",
      severity: "info" as const,
      confidence: "medium" as const,
      message: "Grammar issue flagged by Word.",
    };
    grammarCheck.apply(adapter, finding);
    expect(adapter.mutations).toHaveLength(0);
  });
});
