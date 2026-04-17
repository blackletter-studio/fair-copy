import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const SECTION_SIGN = /\u00a7/;
const SEC_ABBREV = /\bSec\./;
const CASE_NAME_DOUBLE_SPACE = /[A-Z][a-z]+\s{2,}v\.\s{2,}[A-Z]/;

export const citationFormatCheck: Check = {
  name: "citation-format",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    const paragraphs = doc.getAllParagraphs();

    const hasSection = paragraphs.some((p) => SECTION_SIGN.test(p.text));
    const hasSecAbbrev = paragraphs.some((p) => SEC_ABBREV.test(p.text));
    if (hasSection && hasSecAbbrev) {
      for (const para of paragraphs) {
        if (SEC_ABBREV.test(para.text)) {
          findings.push({
            id: `citation-format::sec-abbrev::${para.ref.id}`,
            checkName: "citation-format",
            region: "document",
            range: para.ref,
            excerpt: para.text.slice(0, 140),
            severity: "info",
            confidence: "medium",
            message:
              "Inconsistent section separator: this paragraph uses 'Sec.' while other paragraphs use '\u00a7'.",
          });
        }
      }
    }

    for (const para of paragraphs) {
      if (CASE_NAME_DOUBLE_SPACE.test(para.text)) {
        findings.push({
          id: `citation-format::double-space::${para.ref.id}`,
          checkName: "citation-format",
          region: "document",
          range: para.ref,
          excerpt: para.text.slice(0, 140),
          severity: "info",
          confidence: "medium",
          message: "Double-space inside a citation — Bluebook uses a single space.",
        });
      }
    }

    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
