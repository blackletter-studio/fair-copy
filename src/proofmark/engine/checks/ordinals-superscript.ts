import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const ORDINAL_PATTERN = /\b\d+(st|nd|rd|th)\b/g;

export const ordinalsSuperscriptCheck: Check = {
  name: "ordinals-superscript",
  category: "mechanical",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      const matches = para.text.match(ORDINAL_PATTERN);
      if (!matches || matches.length === 0) continue;
      const firstMatch = matches[0];
      findings.push({
        id: `ordinals-superscript::${para.ref.id}`,
        checkName: "ordinals-superscript",
        region: "document",
        range: para.ref,
        excerpt: para.text.slice(0, 120),
        severity: "info",
        confidence: "medium",
        message:
          "Ordinals like 1st/2nd/3rd/4th — apply superscript formatting or leave as plain text per your firm's style.",
        metadata: { ordinal: firstMatch },
      });
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {
    // Applying superscript is a run-level format change, not a text swap. Left
    // as a no-op for M3; the finding surfaces the issue but the user applies
    // the format via Word's own ribbon. A `setRunSuperscript` primitive is
    // out of scope for M3.
  },
};
