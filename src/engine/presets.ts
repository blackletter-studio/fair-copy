import type { Preset } from "./types";

/** Standard — clean but careful. Default. */
export const standardPreset: Preset = {
  name: "standard",
  rules: {
    "font-face": { mode: "change", target: "IBM Plex Sans", preserveHeadings: true },
    "font-size": { mode: "one-body-size", targetPt: 11, preserveHeadings: true },
    "colored-text": { mode: "convert-to-black" },
    highlighting: { mode: "remove" },
    "bold-italic-underline": { bold: "keep", italic: "keep", underline: "keep" },
    strikethrough: { mode: "keep" },
    alignment: { mode: "keep" },
    "line-spacing": { mode: "set", targetRatio: 1.15 },
    "paragraph-spacing": { mode: "consistent", beforePt: 0, afterPt: 6 },
    "indents-and-tabs": { mode: "normalize" },
    "bullet-lists": { mode: "normalize" },
    "numbered-lists": { mode: "normalize" },
    tables: { mode: "normalize" },
    comments: { mode: "strip" },
    hyperlinks: { mode: "strip-formatting" },
    "section-breaks": { mode: "keep" },
  },
};

/** Conservative — lightest touch. Only normalize font faces and colors. */
export const conservativePreset: Preset = {
  name: "conservative",
  rules: {
    "font-face": { mode: "change", target: "IBM Plex Sans", preserveHeadings: true },
    "colored-text": { mode: "convert-to-black" },
  },
};

/** Aggressive — maximum flatten. Keep only bold/italic/underline + alignment. */
export const aggressivePreset: Preset = {
  name: "aggressive",
  rules: {
    "font-face": { mode: "change", target: "IBM Plex Sans", preserveHeadings: false },
    "font-size": { mode: "one-body-size", targetPt: 11, preserveHeadings: false },
    "colored-text": { mode: "convert-to-black" },
    highlighting: { mode: "remove" },
    "bold-italic-underline": { bold: "keep", italic: "keep", underline: "keep" },
    strikethrough: { mode: "strip" },
    alignment: { mode: "keep" },
    "line-spacing": { mode: "set", targetRatio: 1.15 },
    "paragraph-spacing": { mode: "consistent", beforePt: 0, afterPt: 0 },
    "indents-and-tabs": { mode: "normalize" },
    "bullet-lists": { mode: "strip" },
    "numbered-lists": { mode: "strip" },
    tables: { mode: "normalize" },
    comments: { mode: "strip" },
    hyperlinks: { mode: "strip-formatting" },
    "section-breaks": { mode: "strip" },
  },
};

export const PRESETS: Record<"standard" | "conservative" | "aggressive", Preset> = {
  standard: standardPreset,
  conservative: conservativePreset,
  aggressive: aggressivePreset,
};
