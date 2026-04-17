import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const PAST_MARKERS = /\b(was|were|had|did|been)\b/i;
const PRESENT_MARKERS = /\b(is|are|has|does|shall|will)\b/i;

export const tenseConsistencyCheck: Check = {
  name: "tense-consistency",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    if (region === null) return [];
    const allParagraphs = doc.getAllParagraphs();
    const inRegion = allParagraphs.filter((p) => region.range.some((r) => r.id === p.ref.id));
    if (inRegion.length === 0) return [];
    let past = 0;
    let present = 0;
    for (const p of inRegion) {
      if (PAST_MARKERS.test(p.text)) past++;
      if (PRESENT_MARKERS.test(p.text)) present++;
    }
    if (past === 0 || present === 0) return [];
    const dominant: "past" | "present" = present >= past ? "present" : "past";
    const findings: Finding[] = [];
    for (const p of inRegion) {
      const hasPast = PAST_MARKERS.test(p.text);
      const hasPresent = PRESENT_MARKERS.test(p.text);
      if (dominant === "present" && hasPast && !hasPresent) {
        findings.push({
          id: `tense-consistency::${region.name}::${p.ref.id}`,
          checkName: "tense-consistency",
          region: region.name,
          range: p.ref,
          excerpt: p.text.slice(0, 140),
          severity: "info",
          confidence: "low",
          message: `This paragraph uses past tense while the rest of "${region.name}" is in present tense.`,
        });
      } else if (dominant === "past" && hasPresent && !hasPast) {
        findings.push({
          id: `tense-consistency::${region.name}::${p.ref.id}`,
          checkName: "tense-consistency",
          region: region.name,
          range: p.ref,
          excerpt: p.text.slice(0, 140),
          severity: "info",
          confidence: "low",
          message: `This paragraph uses present tense while the rest of "${region.name}" is in past tense.`,
        });
      }
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
