import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { runGrammar, grammarCheck } from "../../../../src/proofmark/engine/checks/grammar";

describe("runGrammar — back-compat guard", () => {
  it("returns [] when adapter lacks getProofingErrorRanges", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "There is an issue."),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (adapter as any).getProofingErrorRanges;
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("runGrammar — empty proofing errors", () => {
  it("returns [] when Word reports no proofing errors", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "This sentence is fine."),
    ]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });
});

describe("runGrammar — multi-word vs single-word classification", () => {
  it("emits a grammar finding for a multi-word proofing error", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
    ]);
    // Multi-word error → grammar.
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "there their", offset: 10, length: 11 }]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.checkName).toBe("grammar");
    expect(findings[0]!.region).toBe("document");
    expect(findings[0]!.severity).toBe("info");
    expect(findings[0]!.confidence).toBe("medium");
    expect(findings[0]!.message).toMatch(/grammar/i);
  });

  it("skips single-word proofing errors (spelling owns those)", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "wittnes", offset: 4, length: 7 }]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
  });

  it("grammar finding carries correct id, range, and metadata", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 0, text: "there their", offset: 10, length: 11 }]);
    const findings = await runGrammar(adapter, []);
    const f = findings[0]!;
    expect(f.id).toBe("grammar::para-0::10");
    expect(f.range.id).toBe("spell-0-10-11");
    expect(f.range.kind).toBe("run");
    expect(f.metadata).toMatchObject({ text: "there their", offset: 10 });
  });

  it("handles multiple grammar errors across different paragraphs", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "They went there their car was parked."),
      FakeDocumentAdapter.makeParagraph("para-1", "Is it okay your going now."),
    ]);
    adapter.setProofingErrors([
      { paragraphIndex: 0, text: "there their", offset: 10, length: 11 },
      { paragraphIndex: 1, text: "your going", offset: 9, length: 10 },
    ]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(2);
    expect(findings[0]!.id).toBe("grammar::para-0::10");
    expect(findings[1]!.id).toBe("grammar::para-1::9");
  });

  it("skips errors for paragraph indexes that have no matching paragraph", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Hello world."),
    ]);
    adapter.setProofingErrors([{ paragraphIndex: 99, text: "there their", offset: 0, length: 11 }]);
    const findings = await runGrammar(adapter, []);
    expect(findings).toHaveLength(0);
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
      range: { id: "spell-0-10-11", kind: "run" as const },
      excerpt: "…there their car…",
      severity: "info" as const,
      confidence: "medium" as const,
      message: "Grammar issue flagged by Word.",
    };
    grammarCheck.apply(adapter, finding);
    expect(adapter.mutations).toHaveLength(0);
  });
});
