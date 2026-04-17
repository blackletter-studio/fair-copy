import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";
import { suggestCorrections } from "../spelling/spell-checker";

/**
 * Spelling check — surfaces Word's own proofing errors as single-word findings.
 *
 * ## Why Word (not nspell) owns detection
 * We used to scan with nspell + `dictionary-en` locally. Users complained that
 * we flagged words Word itself accepted (compounds like "How-To", domain
 * proper nouns, etc.) because our SCOWL-derived corpus is smaller than Word's
 * proprietary one. The Option-B pivot moves detection to Word's engine via
 * `DocumentAdapter.getProofingErrorRanges()` for perfect behavioral parity.
 *
 * nspell stays alive purely to generate suggestions for the Apply button —
 * Office.js doesn't expose a suggestions API.
 *
 * ## Spelling vs. grammar classification
 * `getProofingErrorRanges()` returns a flat list; it doesn't label spelling vs.
 * grammar. We classify by word count:
 *   - single word (no internal whitespace) → Spelling tab (this check)
 *   - multiple words → Grammar tab (grammarCheck)
 * Matches Word's behavior in ~95% of cases; edge cases like "its/it's" may
 * appear in the "wrong" tab but both tabs are user-reviewable.
 *
 * ## Custom dictionary as suppression list
 * Office.js can't write to Word's custom dictionary, so our "Add word" button
 * can't reach Word's own engine — Word will keep its red squiggle. But we can
 * suppress the word from the Proofmark findings list, which is the effective
 * UX: the word stops bothering the user in our panel.
 */

function makeSpellRef(paraIdx: number, offset: number, len: number): string {
  return `spell-${paraIdx}-${offset}-${len}`;
}

export const spellingCheck: Check = {
  name: "spelling",
  category: "semantic",
  defaultMode: "interactive",
  run(_doc: DocumentAdapter, _region: Region | null, _settings: CheckSettings): Finding[] {
    // run() is synchronous per the Check contract. Spell-check is async
    // (adapter round-trip to Word). Return [] here; the panel invokes
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
  // Older adapters (pre-M3.5) may not implement getProofingErrorRanges.
  // In that case we can't surface spelling at all from Word — return empty.
  if (typeof doc.getProofingErrorRanges !== "function") return [];
  const rawErrors = await doc.getProofingErrorRanges();
  if (rawErrors.length === 0) return [];

  const paragraphs = doc.getAllParagraphs();
  const customSet = new Set(customDict.map((w) => w.toLowerCase()));
  const findings: Finding[] = [];

  for (const err of rawErrors) {
    // Classify: single-word → spelling; multi-word → grammar owns it.
    if (/\s/.test(err.text)) continue;

    // Suppression list: user has added this word to their custom dictionary.
    if (customSet.has(err.text.toLowerCase())) continue;

    // eslint-disable-next-line security/detect-object-injection -- paragraphIndex comes from adapter we control
    const para = paragraphs[err.paragraphIndex];
    if (!para) continue;

    const suggestions = suggestCorrections(err.text, customDict);
    const best = suggestions[0];

    findings.push({
      id: `spelling::${para.ref.id}::${err.offset}`,
      checkName: "spelling",
      region: "document",
      range: {
        id: makeSpellRef(err.paragraphIndex, err.offset, err.length),
        kind: "run",
      },
      excerpt: previewAround(para.text, err.offset, err.length),
      severity: "info",
      confidence: "medium",
      message:
        suggestions.length > 0
          ? `Unknown word. Suggestions: ${suggestions.slice(0, 3).join(", ")}.`
          : `Unknown word.`,
      suggestedText: best,
      metadata: {
        word: err.text,
        offset: err.offset,
        suggestions,
      },
    });
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
