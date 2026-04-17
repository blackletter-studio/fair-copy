import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const SECTION_SIGN_WITH_SPACE = /\u00a7\s+(\d)/g;

export const nonBreakingSectionSignCheck: Check = {
  name: "non-breaking-section-sign",
  category: "mechanical",
  defaultMode: "destructive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      SECTION_SIGN_WITH_SPACE.lastIndex = 0;
      if (!SECTION_SIGN_WITH_SPACE.test(para.text)) continue;
      SECTION_SIGN_WITH_SPACE.lastIndex = 0;
      const suggested = para.text.replace(SECTION_SIGN_WITH_SPACE, "\u00a7\u00a0$1");
      if (suggested === para.text) continue;
      findings.push({
        id: `non-breaking-section-sign::${para.ref.id}`,
        checkName: "non-breaking-section-sign",
        region: "document",
        range: para.ref,
        excerpt: para.text.slice(0, 120),
        severity: "info",
        confidence: "high",
        message: "Use a non-breaking space between the section sign (\u00a7) and its number.",
        suggestedText: suggested,
      });
    }
    return findings;
  },
  apply(doc: DocumentAdapter, finding: Finding): void {
    if (finding.suggestedText === undefined) return;
    doc.setParagraphText(finding.range, finding.suggestedText);
  },
};
