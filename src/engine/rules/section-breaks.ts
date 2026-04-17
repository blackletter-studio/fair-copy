import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface SectionBreaksSettings {
  mode: "keep" | "strip";
}

export const sectionBreaksRule: Rule = {
  name: "section-breaks" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as SectionBreaksSettings;
    if (s.mode === "strip") doc.removeSectionBreaks();
  },
};
