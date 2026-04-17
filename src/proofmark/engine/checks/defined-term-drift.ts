import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const DEF_PATTERN = /"([^"]+)"\s+(?:means|shall\s+mean)\b/gi;

function extractDefinedTerms(doc: DocumentAdapter): string[] {
  const terms = new Set<string>();
  for (const para of doc.getAllParagraphs()) {
    DEF_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = DEF_PATTERN.exec(para.text)) !== null) {
      const term = m[1]?.trim();
      if (term && /^[A-Z]/.test(term)) terms.add(term);
    }
  }
  return Array.from(terms);
}

export const definedTermDriftCheck: Check = {
  name: "defined-term-drift",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const terms = extractDefinedTerms(doc);
    if (terms.length === 0) return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      DEF_PATTERN.lastIndex = 0;
      if (DEF_PATTERN.test(para.text)) {
        DEF_PATTERN.lastIndex = 0;
        continue;
      }
      DEF_PATTERN.lastIndex = 0;
      for (const term of terms) {
        const lower = term.toLowerCase();
        if (term === lower) continue;
        const escapedLower = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const lowerRegex = new RegExp(`\\b${escapedLower}\\b`, "g");
        if (lowerRegex.test(para.text)) {
          findings.push({
            id: `defined-term-drift::${para.ref.id}::${term}`,
            checkName: "defined-term-drift",
            region: "document",
            range: para.ref,
            excerpt: para.text.slice(0, 140),
            severity: "warn",
            confidence: "medium",
            message: `Defined term "${term}" appears in lowercase here — verify the intended casing.`,
            metadata: { term },
          });
        }
      }
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
