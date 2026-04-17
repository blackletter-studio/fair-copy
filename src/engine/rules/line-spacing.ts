import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface LineSpacingSettings {
  mode: "keep" | "set";
  /** Multiple of font size (e.g. 1.15 = 115%). */
  targetRatio?: number;
}

/**
 * Word.Paragraph.lineSpacing is measured in POINTS, not as a ratio. So a
 * preset asking for `targetRatio: 1.15` must be converted to a points value
 * before the adapter writes it, otherwise Word interprets 1.15 as "1.15pt
 * line spacing" and every line collapses on top of the next.
 *
 * Ideal fix: look up each paragraph's actual font size at write time and
 * multiply by the ratio. For M2 we use an assumed body size (11pt — matches
 * the Standard preset's `font-size.targetPt`). This is a good approximation
 * for body text; headings at larger sizes get the same resolved points,
 * which is visually conservative (slightly tighter than ideal but never
 * collapsed). Refine in M2.5 by reading per-paragraph font size.
 */
export const ASSUMED_BODY_POINTS = 11;

export const lineSpacingRule: Rule = {
  name: "line-spacing" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as LineSpacingSettings;
    if (s.mode === "keep" || typeof s.targetRatio !== "number") return;
    const lineSpacingPt = s.targetRatio * ASSUMED_BODY_POINTS;
    for (const para of doc.getAllParagraphs()) {
      doc.setParagraphFormat(para.ref, { lineSpacing: lineSpacingPt });
    }
  },
};
