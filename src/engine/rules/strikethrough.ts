import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface StrikethroughSettings {
  mode: "keep" | "strip";
}

export const strikethroughRule: Rule = {
  name: "strikethrough" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as StrikethroughSettings;
    if (s.mode === "keep") return;
    for (const para of doc.getAllParagraphs()) {
      for (const run of para.runs) {
        doc.setTextFormat(run.ref, { strikethrough: false });
      }
    }
  },
};
