import { describe, it, expect, vi } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { applyFindingsInBatch } from "../../../src/proofmark/findings/apply-batch";
import type { Check, Finding } from "../../../src/proofmark/engine/types";

function makeFinding(overrides: Partial<Finding>): Finding {
  return {
    id: "f-default",
    checkName: "straight-quotes",
    region: "document",
    range: { id: "para-0", kind: "paragraph" },
    excerpt: "x",
    severity: "info",
    confidence: "high",
    message: "m",
    ...overrides,
  };
}

describe("applyFindingsInBatch", () => {
  it("calls apply on the matching check for each finding, then commits once", async () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "x")]);
    const commitSpy = vi.spyOn(adapter, "commit");

    const applied: Finding[] = [];
    const stubCheck: Check = {
      name: "straight-quotes",
      category: "mechanical",
      defaultMode: "destructive",
      run: () => [],
      apply: (_doc, finding) => {
        applied.push(finding);
      },
    };

    const f1 = makeFinding({ id: "f1", checkName: "straight-quotes" });
    const f2 = makeFinding({ id: "f2", checkName: "straight-quotes" });

    await applyFindingsInBatch(adapter, [stubCheck], [f1, f2]);

    expect(applied.map((f) => f.id)).toEqual(["f1", "f2"]);
    expect(commitSpy).toHaveBeenCalledTimes(1);
  });

  it("skips findings whose check isn't in the provided list", async () => {
    const adapter = new FakeDocumentAdapter();
    const applied: Finding[] = [];
    const quotesCheck: Check = {
      name: "straight-quotes",
      category: "mechanical",
      defaultMode: "destructive",
      run: () => [],
      apply: (_doc, finding) => {
        applied.push(finding);
      },
    };

    const knownFinding = makeFinding({ id: "known", checkName: "straight-quotes" });
    const unknownFinding = makeFinding({ id: "unknown", checkName: "em-en-dashes" });

    await applyFindingsInBatch(adapter, [quotesCheck], [knownFinding, unknownFinding]);

    expect(applied.map((f) => f.id)).toEqual(["known"]);
  });

  it("no-ops (and does not commit) when findings is empty", async () => {
    const adapter = new FakeDocumentAdapter();
    const commitSpy = vi.spyOn(adapter, "commit");
    await applyFindingsInBatch(adapter, [], []);
    expect(commitSpy).not.toHaveBeenCalled();
  });
});
