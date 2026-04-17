import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const PARTY_DEF =
  /\b([A-Z][A-Za-z0-9&.]{0,30}(?:\s+[A-Z][A-Za-z0-9&.]{0,30}){0,4}\s*(?:Corp\.|Inc\.|LLC|Ltd\.|Company|LLP|LP))\s*\(["\u201c]([^"\u201d]+)["\u201d]\)/g;
const ENTITY_SUFFIXES = [
  "Corp.",
  "Inc.",
  "LLC",
  "Ltd.",
  "Company",
  "LLP",
  "LP",
  "Corporation",
  "Incorporated",
];

interface PartyRecord {
  canonical: string;
  root: string;
  label: string;
}

function extractParties(doc: DocumentAdapter): PartyRecord[] {
  const parties: PartyRecord[] = [];
  for (const para of doc.getAllParagraphs()) {
    PARTY_DEF.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PARTY_DEF.exec(para.text)) !== null) {
      const canonical = m[1]?.trim();
      const label = m[2]?.trim();
      if (!canonical || !label) continue;
      let root = canonical;
      for (const s of ENTITY_SUFFIXES) {
        if (root.endsWith(s)) {
          root = root.slice(0, -s.length).trim();
          break;
        }
      }
      parties.push({ canonical, root, label });
    }
  }
  return parties;
}

export const partyNameConsistencyCheck: Check = {
  name: "party-name-consistency",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const parties = extractParties(doc);
    if (parties.length === 0) return [];
    const findings: Finding[] = [];
    for (const party of parties) {
      if (party.root.length < 2) continue;
      const escapedRoot = party.root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const variantRe = new RegExp(`\\b${escapedRoot}\\s+([A-Z][a-z]+)`, "g");
      for (const para of doc.getAllParagraphs()) {
        if (para.text.includes(party.canonical)) continue;
        variantRe.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = variantRe.exec(para.text)) !== null) {
          const suffix = m[1];
          if (!suffix) continue;
          const candidate = `${party.root} ${suffix}`;
          const suffixNormalized = suffix.replace(/\.$/, "") + ".";
          const canonicalSuffix = party.canonical.slice(party.root.length).trim();
          if (suffixNormalized === canonicalSuffix || suffix === canonicalSuffix) continue;
          if (candidate === party.canonical) continue;
          findings.push({
            id: `party-name-consistency::${para.ref.id}::${candidate}`,
            checkName: "party-name-consistency",
            region: "document",
            range: para.ref,
            excerpt: para.text.slice(0, 140),
            severity: "warn",
            confidence: "medium",
            message: `Party "${party.canonical}" (${party.label}) is referenced here as "${candidate}" — verify spelling.`,
            metadata: { canonical: party.canonical, variant: candidate },
          });
        }
      }
    }
    return findings;
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {},
};
