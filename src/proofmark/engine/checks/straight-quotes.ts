import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

/**
 * Curlify straight single/double quotes. Opening vs closing is chosen by
 * whether the preceding character is whitespace / start-of-string (opening)
 * or anything else (closing). Apostrophes inside words (e.g. "don't") resolve
 * to closing single quote (U+2019), which is correct Unicode.
 */
function curlify(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    const prev = i > 0 ? text.charAt(i - 1) : "";
    const isOpen = prev === "" || /\s/.test(prev);
    if (ch === '"') {
      out += isOpen ? "\u201c" : "\u201d";
    } else if (ch === "'") {
      out += isOpen ? "\u2018" : "\u2019";
    } else {
      out += ch;
    }
  }
  return out;
}

export const straightQuotesCheck: Check = {
  name: "straight-quotes",
  category: "mechanical",
  defaultMode: "destructive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      if (!/["']/.test(para.text)) continue;
      const suggested = curlify(para.text);
      if (suggested === para.text) continue;
      findings.push({
        id: `straight-quotes::${para.ref.id}`,
        checkName: "straight-quotes",
        region: "document",
        range: para.ref,
        excerpt: para.text.slice(0, 120),
        severity: "info",
        confidence: "high",
        message: "Replace straight quotes with typographically correct curly quotes.",
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
