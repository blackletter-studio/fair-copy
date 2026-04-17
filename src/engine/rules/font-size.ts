import type { Rule, DocumentAdapter, RuleName } from "../types";

export interface FontSizeSettings {
  mode: "keep" | "one-body-size" | "specific";
  targetPt?: number;
  preserveHeadings?: boolean;
}

const HEADING_STYLE_RE = /^(Heading \d|Title|Subtitle)$/;

export const fontSizeRule: Rule = {
  name: "font-size" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as FontSizeSettings;
    if (settings.mode === "keep" || !settings.targetPt) return;

    for (const para of doc.getAllParagraphs()) {
      if (
        settings.preserveHeadings &&
        para.paragraphFormat.styleName &&
        HEADING_STYLE_RE.test(para.paragraphFormat.styleName)
      ) {
        continue;
      }
      for (const run of para.runs) {
        doc.setTextFormat(run.ref, { fontSize: settings.targetPt });
      }
    }
  },
};
