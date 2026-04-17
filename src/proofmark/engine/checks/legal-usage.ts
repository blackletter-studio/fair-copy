import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";
import { LEGAL_CONFUSION } from "../spelling/legal-confusion";

/**
 * Legal-usage check — surfaces confused word pairs specific to legal writing
 * (e.g. "counsul"→"counsel", "judgement"→"judgment", "priviledge"→"privilege").
 *
 * ## Why this is a Style check, not Spelling
 * These are word-choice / usage errors: the flagged word either IS a valid
 * English word used wrongly ("judgement" is fine in UK English, wrong in US
 * legal convention) or is a misspelling so common that generic spell-checkers
 * sometimes accept it. Either way, it's a domain-specific catch that belongs
 * next to citation-format and defined-term-drift in the Style tab, not in the
 * generic Spelling tab.
 *
 * ## Why severity = "warn"
 * These aren't mechanical substitutions like straight-quotes. They reflect an
 * editorial convention (e.g. US vs UK judgment/judgement) and the user should
 * review each one. High confidence because the confusion pairs are curated.
 */

const CONFUSION_MAP = new Map<string, { right: string; note?: string }>(
  LEGAL_CONFUSION.map((p) => [p.wrong.toLowerCase(), { right: p.right, note: p.note }]),
);

// Word-boundary regex: letter run, Unicode-letter-safe enough for legal corpora.
const WORD_RE = /[A-Za-z][A-Za-z'\u2019-]*/g;

function preserveCase(original: string, corrected: string): string {
  if (original === original.toUpperCase()) return corrected.toUpperCase();
  const first = original[0];
  if (first !== undefined && first === first.toUpperCase()) {
    return corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }
  return corrected;
}

function previewAround(text: string, offset: number, len: number): string {
  const start = Math.max(0, offset - 20);
  const end = Math.min(text.length, offset + len + 40);
  const prefix = start > 0 ? "\u2026" : "";
  const suffix = end < text.length ? "\u2026" : "";
  return prefix + text.slice(start, end) + suffix;
}

function paraIndexFromRef(id: string): number | null {
  const m = /^para-(\d+)$/.exec(id);
  if (!m) return null;
  const raw = m[1];
  if (raw === undefined) return null;
  const idx = Number.parseInt(raw, 10);
  return Number.isNaN(idx) ? null : idx;
}

export const legalUsageCheck: Check = {
  name: "legal-usage",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const findings: Finding[] = [];
    for (const para of doc.getAllParagraphs()) {
      for (const match of para.text.matchAll(WORD_RE)) {
        const word = match[0];
        const offset = match.index ?? 0;
        const entry = CONFUSION_MAP.get(word.toLowerCase());
        if (entry === undefined) continue;
        const replacement = preserveCase(word, entry.right);
        const paraIdx = paraIndexFromRef(para.ref.id);
        if (paraIdx === null) continue;
        findings.push({
          id: `legal-usage::${para.ref.id}::${offset}`,
          checkName: "legal-usage",
          region: "document",
          range: {
            id: `spell-${paraIdx}-${offset}-${word.length}`,
            kind: "run",
          },
          excerpt: previewAround(para.text, offset, word.length),
          severity: "warn",
          confidence: "high",
          message: entry.note
            ? `Legal usage: prefer "${entry.right}" (${entry.note}).`
            : `Legal usage: prefer "${entry.right}".`,
          suggestedText: replacement,
          metadata: {
            word,
            offset,
            replacement,
            note: entry.note ?? null,
          },
        });
      }
    }
    return findings;
  },
  apply(doc: DocumentAdapter, finding: Finding): void {
    if (finding.suggestedText === undefined) return;
    doc.replaceRange(finding.range, finding.suggestedText);
  },
};
