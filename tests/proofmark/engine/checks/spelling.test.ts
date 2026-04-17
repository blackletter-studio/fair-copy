import { describe, it, expect, beforeEach } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { runSpelling, spellingCheck } from "../../../../src/proofmark/engine/checks/spelling";
import { resetCheckerCache } from "../../../../src/proofmark/engine/spelling/spell-checker";

beforeEach(() => {
  resetCheckerCache();
});

describe("runSpelling", () => {
  it("returns findings for misspelled words across paragraphs", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
      FakeDocumentAdapter.makeParagraph("para-1", "The defendant was present."),
    ]);
    const findings = await runSpelling(adapter, []);
    expect(findings.length).toBeGreaterThan(0);
    const spellFinding = findings.find((f) => f.metadata?.word === "wittnes");
    expect(spellFinding).toBeDefined();
    expect(spellFinding!.checkName).toBe("spelling");
    expect(spellFinding!.region).toBe("document");
  });

  it("does not flag correctly spelled text", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The witness testified in court."),
    ]);
    const findings = await runSpelling(adapter, []);
    expect(findings).toHaveLength(0);
  });

  it("assigns warn severity and high confidence to legal-confusion findings", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The court issued its judgement."),
    ]);
    const findings = await runSpelling(adapter, []);
    const f = findings.find((x) => (x.metadata?.word as string | undefined) === "judgement");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("warn");
    expect(f!.confidence).toBe("high");
    expect(f!.suggestedText).toBe("judgment");
  });

  it("assigns info severity and medium confidence to standard spelling findings", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    const findings = await runSpelling(adapter, []);
    const f = findings.find((x) => (x.metadata?.word as string | undefined) === "wittnes");
    expect(f).toBeDefined();
    expect(f!.severity).toBe("info");
    expect(f!.confidence).toBe("medium");
  });

  it("encodes a spell-ref in the finding range id", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    const findings = await runSpelling(adapter, []);
    const f = findings.find((x) => (x.metadata?.word as string | undefined) === "wittnes");
    expect(f).toBeDefined();
    expect(f!.range.id).toMatch(/^spell-\d+-\d+-\d+$/);
    expect(f!.range.kind).toBe("run");
  });

  it("suppresses findings for words in the custom dictionary", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The xyzfoo clause applies."),
    ]);
    const findings = await runSpelling(adapter, ["xyzfoo"]);
    expect(findings.find((f) => f.metadata?.word === "xyzfoo")).toBeUndefined();
  });

  it("generates a unique finding id per word per paragraph", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Wittnes wittnes again."),
    ]);
    const findings = await runSpelling(adapter, []);
    // Multiple occurrences of the same misspelled word in one paragraph get distinct ids
    // because their offsets differ.
    const ids = findings.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("spellingCheck.apply", () => {
  it("calls replaceRange on the document adapter with the suggested text", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The wittnes testified."),
    ]);
    const findings = await runSpelling(adapter, []);
    const f = findings.find((x) => (x.metadata?.word as string | undefined) === "wittnes");
    expect(f).toBeDefined();
    spellingCheck.apply(adapter, f!);
    const muts = adapter.mutationsFor("replaceRange");
    expect(muts).toHaveLength(1);
    expect(muts[0]!.ref?.id).toBe(f!.range.id);
    expect(muts[0]!.payload).toBe(f!.suggestedText);
  });

  it("does nothing when finding has no suggestedText", () => {
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
