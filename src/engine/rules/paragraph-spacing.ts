import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface ParagraphSpacingSettings {
  mode: "keep" | "consistent";
  beforePt?: number;
  afterPt?: number;
}

export const paragraphSpacingRule: Rule = {
  name: "paragraph-spacing" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as ParagraphSpacingSettings;
    if (s.mode === "keep") return;
    const before = typeof s.beforePt === "number" ? s.beforePt : 0;
    const after = typeof s.afterPt === "number" ? s.afterPt : 6;
    for (const para of doc.getAllParagraphs()) {
      doc.setParagraphFormat(para.ref, { spaceBefore: before, spaceAfter: after });
    }
  },
};
