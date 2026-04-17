import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../src/engine/fake-document-adapter";
import { runPreset, detectDestructive } from "../../src/engine/run-preset";
import { standardPreset, conservativePreset, aggressivePreset } from "../../src/engine/presets";

describe("runPreset", () => {
  it("returns aborted when tracked changes are present and no decision given", async () => {
    const adapter = new FakeDocumentAdapter(
      [FakeDocumentAdapter.makeParagraph("p1", "body")],
      [],
      [
        {
          ref: { id: "tc1", kind: "run" },
          kind: "insertion",
          author: "a",
          date: "2026-01-01T00:00:00Z",
        },
      ],
    );
    const result = await runPreset(adapter, standardPreset);
    expect(result.kind).toBe("aborted");
    expect(result.detections).toHaveLength(1);
    expect(result.detections[0]?.kind).toBe("tracked-changes");
    expect(adapter.mutations).toEqual([]);
    expect(adapter.committed).toBe(false);
  });

  it("rejects tracked changes when decision says 'reject'", async () => {
    const adapter = new FakeDocumentAdapter(
      [FakeDocumentAdapter.makeParagraph("p1", "body")],
      [],
      [
        {
          ref: { id: "tc1", kind: "run" },
          kind: "insertion",
          author: "a",
          date: "2026-01-01T00:00:00Z",
        },
      ],
    );
    const result = await runPreset(adapter, standardPreset, {
      trackedChanges: "reject",
    });
    expect(result.kind).toBe("ran");
    expect(adapter.mutationsFor("rejectTrackedChange")).toHaveLength(1);
    expect(adapter.committed).toBe(true);
  });

  it("applies all Standard preset rules on a clean document", async () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "clean body paragraph"),
    ]);
    const result = await runPreset(adapter, standardPreset);
    expect(result.kind).toBe("ran");
    expect(result.ruleCount).toBeGreaterThan(10);
    expect(adapter.committed).toBe(true);
  });

  it("Conservative preset applies only a few rules", async () => {
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "body")]);
    const result = await runPreset(adapter, conservativePreset);
    expect(result.kind).toBe("ran");
    expect(result.ruleCount).toBe(2);
  });

  it("Aggressive preset applies at least as many rules as Standard", async () => {
    const clean = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "a")]);
    const standardResult = await runPreset(clean, standardPreset);
    const adapter2 = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", "a")]);
    const aggressiveResult = await runPreset(adapter2, aggressivePreset);
    expect(aggressiveResult.ruleCount).toBeGreaterThanOrEqual(standardResult.ruleCount);
  });
});

describe("detectDestructive", () => {
  it("returns empty array when document is clean", async () => {
    const adapter = new FakeDocumentAdapter();
    expect(await detectDestructive(adapter)).toEqual([]);
  });
});
