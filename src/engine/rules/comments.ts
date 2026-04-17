import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface CommentsSettings {
  mode: "keep" | "strip";
}

export const commentsRule: Rule = {
  name: "comments" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const s = rawSettings as CommentsSettings;
    if (s.mode === "strip") doc.removeComments();
  },
};
