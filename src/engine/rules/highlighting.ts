import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface HighlightingSettings {
  mode: "keep" | "remove";
}

export const highlightingRule: Rule = {
  name: "highlighting" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as HighlightingSettings;
    if (settings.mode === "keep") return;
    for (const para of doc.getAllParagraphs()) {
      for (const run of para.runs) {
        doc.setTextFormat(run.ref, { highlight: null });
      }
    }
  },
};
