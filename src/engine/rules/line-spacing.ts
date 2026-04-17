import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface LineSpacingSettings {
  mode: "keep" | "set";
  targetRatio?: number;
}

export const lineSpacingRule: Rule = {
  name: "line-spacing" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as LineSpacingSettings;
    if (s.mode === "keep" || typeof s.targetRatio !== "number") return;
    for (const para of doc.getAllParagraphs()) {
      doc.setParagraphFormat(para.ref, { lineSpacing: s.targetRatio });
    }
  },
};
