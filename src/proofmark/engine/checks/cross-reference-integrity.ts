import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const REF_PATTERN = /\b(Section|Paragraph|Exhibit|Schedule)\s+([A-Z0-9]+(?:\.[0-9]+)?)\b/g;
// Matches a label at the very start of the trimmed paragraph text.
const LABEL_AT_START_PATTERN =
  /^(Section|Paragraph|Exhibit|Schedule)\s+([A-Z0-9]+(?:\.[0-9]+)?)\b/i;

function collectTargets(doc: DocumentAdapter): Set<string> {
  const targets = new Set<string>();
  for (const para of doc.getAllParagraphs()) {
    const trimmed = para.text.trim();
    const m = LABEL_AT_START_PATTERN.exec(trimmed);
    if (!m) continue;
    const kind = m[1];
    const id = m[2];
    if (kind && id) {
      targets.add(`${kind.toLowerCase()}::${id.toLowerCase()}`);
    }
  }
  return targets;
}

export const crossReferenceIntegrityCheck: Check = {
  name: "cross-reference-integrity",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const targets = collectTargets(doc);
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      REF_PATTERN.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = REF_PATTERN.exec(para.text)) !== null) {
        const kind = m[1];
        const id = m[2];
        if (!kind || !id) continue;
        const key = `${kind.toLowerCase()}::${id.toLowerCase()}`;
        // Skip if this paragraph IS the label for the referenced item
        // (i.e., the paragraph text starts with "Section N").
        const selfMatch = LABEL_AT_START_PATTERN.exec(para.text.trim());
        if (
          selfMatch &&
          selfMatch[1]?.toLowerCase() === kind.toLowerCase() &&
          selfMatch[2]?.toLowerCase() === id.toLowerCase()
        ) {
          continue;
        }
        if (targets.has(key)) continue;
        findings.push({
          id: `cross-reference-integrity::${para.ref.id}::${key}`,
          checkName: "cross-reference-integrity",
          region: "document",
          range: para.ref,
          excerpt: para.text.slice(0, 140),
          severity: "warn",
          confidence: "medium",
          message: `Reference to "${kind} ${id}" has no matching label elsewhere in the document.`,
          metadata: { kind, id },
        });
      }
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
