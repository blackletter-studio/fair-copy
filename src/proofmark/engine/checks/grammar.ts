import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";
import { checkParagraph } from "../spelling/spell-checker";

/**
 * Grammar check — surfaces Word's own proofing errors that are NOT spelling
 * (our nspell engine handles spelling). The split is by elimination: we ask
 * nspell to flag spelling in each paragraph; any proofing-error range whose
 * text passes nspell is treated as a grammar issue.
 *
 * This is a heuristic — Word's proofing-error API doesn't reliably expose
 * an "is-grammar" flag across versions. Check by exclusion is the pragmatic
 * fallback and produces the right user-facing split.
 *
 * The synchronous `run()` is a no-op (like spellingCheck) because the check
 * is async. The panel calls `runGrammar()` directly after the synchronous
 * check pipeline and merges findings.
 */
export const grammarCheck: Check = {
  name: "grammar",
  category: "semantic",
  defaultMode: "interactive",
  run(_doc: DocumentAdapter, _region: Region | null, _settings: CheckSettings): Finding[] {
    // Async check — runGrammar is invoked directly by ProofmarkPanel.
    return [];
  },
  apply(_doc: DocumentAdapter, _finding: Finding): void {
    // Grammar findings are advisory — the user fixes by hand in Word, since
    // grammatical corrections require sentence-level judgment.
  },
};

/**
 * Async entry point — the ProofmarkPanel calls this alongside runSpelling().
 *
 * Algorithm:
 *  1. Fetch all proofing errors from the host (Word).
 *  2. For each flagged range, run nspell on the error text.
 *  3. If nspell considers the text a valid word (not a spelling error), emit a
 *     grammar finding — Word flagged it but our spell-checker didn't, which
 *     implies it's a grammatical/contextual issue.
 *  4. If nspell would also flag it, skip — the spelling check owns it.
 */
export async function runGrammar(
  doc: DocumentAdapter,
  customDict: readonly string[],
): Promise<Finding[]> {
  // Guard: older adapters may not implement getProofingErrorRanges.
  if (typeof doc.getProofingErrorRanges !== "function") return [];
  const rawErrors = await doc.getProofingErrorRanges();
  if (rawErrors.length === 0) return [];

  const paragraphs = doc.getAllParagraphs();
  const findings: Finding[] = [];

  for (const err of rawErrors) {
    // eslint-disable-next-line security/detect-object-injection -- paragraphIndex comes from adapter we control
    const para = paragraphs[err.paragraphIndex];
    if (!para) continue;

    // Run nspell on the error text — if nspell considers it a spelling error,
    // it's already covered by the spelling check. Skip it here.
    const spellResults = await checkParagraph(err.text, customDict);
    const isSpelling = spellResults.some((r) => r.word.toLowerCase() === err.text.toLowerCase());
    if (isSpelling) continue;

    findings.push({
      id: `grammar::${para.ref.id}::${err.offset}`,
      checkName: "grammar",
      region: "document",
      range: {
        id: `spell-${err.paragraphIndex}-${err.offset}-${err.length}`,
        kind: "run",
      },
      excerpt: previewAround(para.text, err.offset, err.length),
      severity: "info",
      confidence: "medium",
      message: `Grammar issue flagged by Word.`,
      metadata: { word: err.text, offset: err.offset },
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
