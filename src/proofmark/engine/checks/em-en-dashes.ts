import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const EM_DASH_WORD = /(\S)\s-\s(\S)/g;
const EN_DASH_NUMERIC = /(\d)\s-\s(\d)/g;

function normalizeDashes(text: string): string {
  // Numeric ranges first: "1990 - 1995" → "1990\u20131995" (en-dash, no spaces).
  let out = text.replace(EN_DASH_NUMERIC, "$1\u2013$2");
  // Then word-word: " - " → thin-space em-dash thin-space.
  out = out.replace(EM_DASH_WORD, "$1\u2009\u2014\u2009$2");
  return out;
}

export const emEnDashesCheck: Check = {
  name: "em-en-dashes",
  category: "mechanical",
  defaultMode: "destructive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      const suggested = normalizeDashes(para.text);
      if (suggested === para.text) continue;
      findings.push({
        id: `em-en-dashes::${para.ref.id}`,
        checkName: "em-en-dashes",
        region: "document",
        range: para.ref,
        excerpt: para.text.slice(0, 120),
        severity: "info",
        confidence: "high",
        message: "Replace hyphen with em-dash (clauses) or en-dash (numeric ranges).",
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
