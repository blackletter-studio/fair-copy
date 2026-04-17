import type { Rule, DocumentAdapter, RuleName, Paragraph } from "../types";

export interface IndentsAndTabsSettings {
  mode: "keep" | "normalize";
}

const STRUCTURAL_STYLE_RE = /^(Quote|BlockQuote|List Paragraph|Bibliography|TOC \d)$/;
const MIN_BODY_LENGTH_FOR_FIRST_LINE_INDENT = 80;

function isStructuralIndent(para: Paragraph): boolean {
  if (para.paragraphFormat.styleName && STRUCTURAL_STYLE_RE.test(para.paragraphFormat.styleName))
    return true;
  if (para.listInfo) return true;
  if (
    para.paragraphFormat.firstLineIndent !== undefined &&
    para.paragraphFormat.firstLineIndent > 0 &&
    para.text.length >= MIN_BODY_LENGTH_FOR_FIRST_LINE_INDENT
  )
    return true;
  return false;
}

export const indentsAndTabsRule: Rule = {
  name: "indents-and-tabs" as RuleName,
  apply(doc: DocumentAdapter, rawSettings: unknown): void {
    const settings = rawSettings as IndentsAndTabsSettings;
    if (settings.mode === "keep") return;
    for (const para of doc.getAllParagraphs()) {
      if (isStructuralIndent(para)) continue;
      doc.setParagraphFormat(para.ref, { leftIndent: 0, firstLineIndent: 0 });
    }
  },
};
