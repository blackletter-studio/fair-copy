import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";
import { checkParagraph } from "../spelling/spell-checker";

/**
 * The spell-check finding's range.id encodes paragraph index and word-offset
 * so selectRange and apply can target the specific word:
 *   spell-<paraIdx>-<offset>-<len>
 */
function makeSpellRef(paraId: string, offset: number, len: number): string {
  const match = /^para-(\d+)$/.exec(paraId);
  const paraIdx = match?.[1] ?? "0";
  return `spell-${paraIdx}-${offset}-${len}`;
}

export const spellingCheck: Check = {
  name: "spelling",
  category: "semantic",
  defaultMode: "interactive",
  run(_doc: DocumentAdapter, _region: Region | null, _settings: CheckSettings): Finding[] {
    // run() is synchronous per the Check contract. Spell-check is async
    // (dictionary load + nspell ops). Return [] here; the panel invokes
    // runSpelling() directly and merges results.
    return [];
  },
  apply(doc: DocumentAdapter, finding: Finding): void {
    if (finding.suggestedText === undefined) return;
    doc.replaceRange(finding.range, finding.suggestedText);
  },
};

/**
 * Async entry point — the ProofmarkPanel calls this separately from the
 * synchronous runChecks pipeline.
 */
export async function runSpelling(
  doc: DocumentAdapter,
  customDict: readonly string[],
): Promise<Finding[]> {
  const paragraphs = doc.getAllParagraphs();
  const findings: Finding[] = [];
  for (const para of paragraphs) {
    const results = await checkParagraph(para.text, customDict);
    for (const r of results) {
      const best = r.suggestions[0];
      findings.push({
        id: `spelling::${para.ref.id}::${r.offset}`,
        checkName: "spelling",
        region: "document",
        range: {
          id: makeSpellRef(para.ref.id, r.offset, r.word.length),
          kind: "run",
        },
        excerpt: previewAround(para.text, r.offset, r.word.length),
        severity: r.legalConfusionFix ? "warn" : "info",
        confidence: r.legalConfusionFix ? "high" : "medium",
        message: r.legalConfusionFix
          ? `Likely misspelling \u2014 did you mean "${r.legalConfusionFix}"?`
          : r.suggestions.length > 0
            ? `Unknown word. Suggestions: ${r.suggestions.slice(0, 3).join(", ")}.`
            : `Unknown word.`,
        suggestedText: best,
        metadata: {
          word: r.word,
          offset: r.offset,
          suggestions: r.suggestions,
          legalConfusion: r.legalConfusionFix ?? null,
        },
      });
    }
  }
  return findings;
}

function previewAround(text: string, offset: number, len: number): string {
  const start = Math.max(0, offset - 20);
  const end = Math.min(text.length, offset + len + 40);
  const prefix = start > 0 ? "\u2026" : "";
  const suffix = end < text.length ? "\u2026" : "";
  return prefix + text.slice(start, end) + suffix;
}
