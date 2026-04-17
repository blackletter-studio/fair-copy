import type { Rule, DocumentAdapter, RuleName, TextFormat } from "../types";

export interface BoldItalicUnderlineSettings {
  bold: "keep" | "strip";
  italic: "keep" | "strip";
  underline: "keep" | "strip";
}

export const boldItalicUnderlineRule: Rule = {
  name: "bold-italic-underline" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as BoldItalicUnderlineSettings;
    const mutation: Partial<TextFormat> = {};
    if (s.bold === "strip") mutation.bold = false;
    if (s.italic === "strip") mutation.italic = false;
    if (s.underline === "strip") mutation.underline = false;
    if (Object.keys(mutation).length === 0) return;

    for (const para of doc.getAllParagraphs()) {
      for (const run of para.runs) {
        doc.setTextFormat(run.ref, mutation);
      }
    }
  },
};
