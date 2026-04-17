import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const HOMOPHONES: Array<{ word: string; partner: string; note: string }> = [
  { word: "their", partner: "there", note: "their (possessive) vs there (location)" },
  { word: "there", partner: "their", note: "there (location) vs their (possessive)" },
  { word: "counsel", partner: "council", note: "counsel (lawyer/advice) vs council (body)" },
  { word: "council", partner: "counsel", note: "council (body) vs counsel (lawyer/advice)" },
  { word: "principal", partner: "principle", note: "principal (main/sum) vs principle (rule)" },
  { word: "principle", partner: "principal", note: "principle (rule) vs principal (main/sum)" },
  { word: "effect", partner: "affect", note: "effect (noun/result) vs affect (verb/influence)" },
  { word: "affect", partner: "effect", note: "affect (verb/influence) vs effect (noun/result)" },
  {
    word: "compliment",
    partner: "complement",
    note: "compliment (praise) vs complement (completes)",
  },
  {
    word: "complement",
    partner: "compliment",
    note: "complement (completes) vs compliment (praise)",
  },
  { word: "discreet", partner: "discrete", note: "discreet (careful) vs discrete (separate)" },
  { word: "discrete", partner: "discreet", note: "discrete (separate) vs discreet (careful)" },
  { word: "elicit", partner: "illicit", note: "elicit (draw out) vs illicit (unlawful)" },
  { word: "illicit", partner: "elicit", note: "illicit (unlawful) vs elicit (draw out)" },
  { word: "farther", partner: "further", note: "farther (distance) vs further (degree)" },
  { word: "further", partner: "farther", note: "further (degree) vs farther (distance)" },
];

export const legalHomophonesCheck: Check = {
  name: "legal-homophones",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      for (const { word, partner, note } of HOMOPHONES) {
        const re = new RegExp(`\\b${word}\\b`, "i");
        if (!re.test(para.text)) continue;
        findings.push({
          id: `legal-homophones::${para.ref.id}::${word}`,
          checkName: "legal-homophones",
          region: "document",
          range: para.ref,
          excerpt: para.text.slice(0, 140),
          severity: "info",
          confidence: "low",
          message: `Possible homophone confusion: "${word}" (did you mean "${partner}"?). ${note}`,
          metadata: { word, partner },
        });
      }
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
