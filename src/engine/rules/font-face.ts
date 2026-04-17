import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface FontFaceSettings {
  mode: "keep" | "change";
  target?: string;
  preserveHeadings?: boolean;
}

const HEADING_STYLE_RE = /^(Heading \d|Title|Subtitle)$/;

export const fontFaceRule: Rule = {
  name: "font-face" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as FontFaceSettings;
    if (settings.mode === "keep") return;
    if (!settings.target) return;

    for (const para of doc.getAllParagraphs()) {
      if (
        settings.preserveHeadings &&
        para.paragraphFormat.styleName &&
        HEADING_STYLE_RE.test(para.paragraphFormat.styleName)
      ) {
        continue;
      }
      for (const run of para.runs) {
        doc.setTextFormat(run.ref, { fontName: settings.target });
      }
    }
  },
};
