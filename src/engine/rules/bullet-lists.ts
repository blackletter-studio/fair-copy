import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface BulletListsSettings {
  mode: "keep" | "normalize" | "strip";
}

export const bulletListsRule: Rule = {
  name: "bullet-lists" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as BulletListsSettings;
    if (settings.mode === "keep") return;
    for (const para of doc.getAllParagraphs()) {
      if (para.listInfo?.type !== "bullet") continue;
      if (settings.mode === "normalize") {
        doc.setListStyle(para.ref, {
          type: "bullet",
          markerStyle: "simple",
          level: para.listInfo.level,
        });
      } else {
        doc.setListStyle(para.ref, null);
      }
    }
  },
};
