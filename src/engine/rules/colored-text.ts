import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface ColoredTextSettings {
  mode: "keep" | "convert-to-black";
}

const TARGET_INK = "#1a1a1a";

export const coloredTextRule: Rule = {
  name: "colored-text" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as ColoredTextSettings;
    if (settings.mode === "keep") return;
    for (const para of doc.getAllParagraphs()) {
      for (const run of para.runs) {
        doc.setTextFormat(run.ref, { fontColor: TARGET_INK });
      }
    }
  },
};
