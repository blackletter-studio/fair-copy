import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface NumberedListsSettings {
  mode: "keep" | "normalize" | "strip";
}

export const numberedListsRule: Rule = {
  name: "numbered-lists" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as NumberedListsSettings;
    if (settings.mode === "keep") return;
    for (const para of doc.getAllParagraphs()) {
      if (para.listInfo?.type !== "number") continue;
      if (settings.mode === "normalize") {
        doc.setListStyle(para.ref, {
          type: "number",
          markerStyle: "simple",
          level: para.listInfo.level,
        });
      } else {
        doc.setListStyle(para.ref, null);
      }
    }
  },
};
