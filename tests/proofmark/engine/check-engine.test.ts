import { describe, it, expect, vi } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { runChecks } from "../../../src/proofmark/engine/check-engine";
import { PROOFMARK_PRESETS } from "../../../src/proofmark/presets";
import type { Check, Finding, Region } from "../../../src/proofmark/engine/types";

function stubCheck(
  name: Check["name"],
  behavior: (region: Region | null) => Finding[],
  overrides: Partial<Check> = {},
): Check {
  return {
    name,
    category: overrides.category ?? "mechanical",
    defaultMode: overrides.defaultMode ?? "destructive",
    run: vi.fn((_doc, region) => behavior(region)),
    apply: vi.fn(),
  } as Check;
}

describe("runChecks", () => {
  it("invokes each check once with null region when no regions are provided", () => {
    const adapter = new FakeDocumentAdapter([]);
    const c = stubCheck("straight-quotes", () => []);
    runChecks(adapter, [c], [], PROOFMARK_PRESETS.standard);
    expect(c.run).toHaveBeenCalledTimes(1);
    expect((c.run as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]).toBeNull();
  });

  it("skips checks whose mode is overridden to 'off' in preset", () => {
    const adapter = new FakeDocumentAdapter([]);
    const c = stubCheck("straight-quotes", () => []);
    const preset = {
      ...PROOFMARK_PRESETS.standard,
      checkOverrides: { "straight-quotes": "off" as const },
    };
    runChecks(adapter, [c], [], preset);
    expect(c.run).not.toHaveBeenCalled();
  });

  it("collects findings from multiple checks", () => {
    const adapter = new FakeDocumentAdapter([]);
    const findingA: Finding = {
      id: "a",
      checkName: "straight-quotes",
      region: "document",
      range: { id: "p1", kind: "paragraph" },
      excerpt: "x",
      severity: "info",
      confidence: "high",
      message: "m",
    };
    const findingB: Finding = {
      id: "b",
      checkName: "em-en-dashes",
      region: "document",
      range: { id: "p2", kind: "paragraph" },
      excerpt: "y",
      severity: "info",
      confidence: "high",
      message: "m",
    };
    const c1 = stubCheck("straight-quotes", () => [findingA]);
    const c2 = stubCheck("em-en-dashes", () => [findingB]);
    const result = runChecks(adapter, [c1, c2], [], PROOFMARK_PRESETS.standard);
    expect(result.map((f) => f.id).sort()).toEqual(["a", "b"]);
  });

  it("calls region-scoped checks once per region (tense-consistency)", () => {
    const adapter = new FakeDocumentAdapter([]);
    const c = stubCheck("tense-consistency", () => [], {
      category: "semantic",
      defaultMode: "interactive",
    });
    const regions: Region[] = [
      {
        name: "recitals",
        range: [{ id: "p1", kind: "paragraph" }],
        confidence: "high",
        confirmed: true,
      },
      {
        name: "indemnification",
        range: [{ id: "p2", kind: "paragraph" }],
        confidence: "high",
        confirmed: true,
      },
    ];
    runChecks(adapter, [c], regions, PROOFMARK_PRESETS.standard);
    expect(c.run).toHaveBeenCalledTimes(2);
    expect((c.run as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]).toBe(regions[0]);
  });

  it("deduplicates findings with the same check + same range", () => {
    const adapter = new FakeDocumentAdapter([]);
    const f = (id: string): Finding => ({
      id,
      checkName: "straight-quotes",
      region: "document",
      range: { id: "p1", kind: "paragraph" },
      excerpt: "x",
      severity: "info",
      confidence: "high",
      message: "m",
    });
    const c = stubCheck("straight-quotes", () => [f("a"), f("b")]);
    const result = runChecks(adapter, [c], [], PROOFMARK_PRESETS.standard);
    expect(result).toHaveLength(1);
  });
});
