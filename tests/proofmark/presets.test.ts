import { describe, it, expect } from "vitest";
import { PROOFMARK_PRESETS, resolvePreset } from "../../src/proofmark/presets";

describe("proofmark presets", () => {
  it("exposes Quiet / Standard / Loud by name", () => {
    expect(PROOFMARK_PRESETS.quiet.name).toBe("quiet");
    expect(PROOFMARK_PRESETS.standard.name).toBe("standard");
    expect(PROOFMARK_PRESETS.loud.name).toBe("loud");
  });

  it("Quiet is list-only", () => {
    const p = PROOFMARK_PRESETS.quiet;
    expect(p.surfaces).toEqual({ list: true, comments: false, highlights: false });
    expect(p.autoApplyThreshold).toBe("high");
  });

  it("Standard adds comments", () => {
    const p = PROOFMARK_PRESETS.standard;
    expect(p.surfaces).toEqual({ list: true, comments: true, highlights: false });
    expect(p.autoApplyThreshold).toBe("medium");
  });

  it("Loud adds highlights", () => {
    const p = PROOFMARK_PRESETS.loud;
    expect(p.surfaces).toEqual({ list: true, comments: true, highlights: true });
    expect(p.autoApplyThreshold).toBe("medium");
  });

  it("resolvePreset returns Standard for unknown names", () => {
    expect(resolvePreset("unknown")).toBe(PROOFMARK_PRESETS.standard);
  });

  it("resolvePreset returns Quiet for 'quiet'", () => {
    expect(resolvePreset("quiet")).toBe(PROOFMARK_PRESETS.quiet);
  });
});
