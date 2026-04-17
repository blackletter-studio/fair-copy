import type { Rule, DocumentAdapter, RuleName, ParagraphFormat } from "../types";

export interface AlignmentSettings {
  mode: "keep" | "set";
  target?: ParagraphFormat["alignment"];
}

export const alignmentRule: Rule = {
  name: "alignment" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as AlignmentSettings;
    if (s.mode === "keep" || !s.target) return;
    for (const para of doc.getAllParagraphs()) {
      doc.setParagraphFormat(para.ref, { alignment: s.target });
    }
  },
};
