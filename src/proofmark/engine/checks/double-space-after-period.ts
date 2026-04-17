import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const DOUBLE_SPACE_AFTER_PERIOD = /\.\s{2,}(?=\S)/g;

export const doubleSpaceAfterPeriodCheck: Check = {
  name: "double-space-after-period",
  category: "mechanical",
  defaultMode: "destructive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      DOUBLE_SPACE_AFTER_PERIOD.lastIndex = 0;
      if (!DOUBLE_SPACE_AFTER_PERIOD.test(para.text)) continue;
      DOUBLE_SPACE_AFTER_PERIOD.lastIndex = 0;
      const suggested = para.text.replace(DOUBLE_SPACE_AFTER_PERIOD, ". ");
      if (suggested === para.text) continue;
      findings.push({
        id: `double-space-after-period::${para.ref.id}`,
        checkName: "double-space-after-period",
        region: "document",
        range: para.ref,
        excerpt: para.text.slice(0, 120),
        severity: "info",
        confidence: "high",
        message: "Collapse two spaces after a period into one.",
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
