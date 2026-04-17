import type { CheckName, CheckMode, ConfidenceTier } from "./engine/types";

export type PresetName = "quiet" | "standard" | "loud" | "custom";

export interface ProofmarkPreset {
  name: PresetName;
  surfaces: { list: true; comments: boolean; highlights: boolean };
  autoApplyThreshold: ConfidenceTier | "off";
  checkOverrides: Partial<Record<CheckName, CheckMode>>;
}

export const PROOFMARK_PRESETS: Record<"quiet" | "standard" | "loud", ProofmarkPreset> = {
  quiet: {
    name: "quiet",
    surfaces: { list: true, comments: false, highlights: false },
    autoApplyThreshold: "high",
    checkOverrides: {},
  },
  standard: {
    name: "standard",
    surfaces: { list: true, comments: true, highlights: false },
    autoApplyThreshold: "medium",
    checkOverrides: {},
  },
  loud: {
    name: "loud",
    surfaces: { list: true, comments: true, highlights: true },
    autoApplyThreshold: "medium",
    checkOverrides: {},
  },
};

export function resolvePreset(name: string): ProofmarkPreset {
  if (name === "quiet") return PROOFMARK_PRESETS.quiet;
  if (name === "loud") return PROOFMARK_PRESETS.loud;
  // Default: standard (covers "standard", "custom", and any unknown string).
  return PROOFMARK_PRESETS.standard;
}
