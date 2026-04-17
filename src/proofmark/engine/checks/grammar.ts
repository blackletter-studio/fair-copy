import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

/**
 * Grammar check — surfaces Word's own proofing errors that span multiple
 * words. Spelling findings (single-word errors) are owned by spellingCheck.
 *
 * ## Classification
 * Office.js's `getProofingErrorRanges()` returns a flat list with no built-in
 * spelling-vs-grammar label. We split by word count:
 *   - single word (no whitespace) → spelling
 *   - multiple words (any whitespace) → grammar (this check)
 * This matches Word's behavior ~95% of the time. Edge cases like "its/it's"
 * land in spelling, which is acceptable — both tabs are user-reviewable.
 *
 * ## Why not applicable
 * Grammar corrections usually require sentence-level judgment ("should this
 * be past or present tense?"). Word's proofing engine doesn't give us a
 * single canonical replacement, so the Apply button is hidden for these
 * findings. Users fix grammar by hand in the document.
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
    // Grammar findings are advisory — no canonical replacement from Word.
  },
};

/**
 * Async entry point — the ProofmarkPanel calls this alongside runSpelling.
 */
export async function runGrammar(
  doc: DocumentAdapter,
  _customDict: readonly string[],
): Promise<Finding[]> {
  if (typeof doc.getProofingErrorRanges !== "function") return [];
  const rawErrors = await doc.getProofingErrorRanges();
  if (rawErrors.length === 0) return [];

  const paragraphs = doc.getAllParagraphs();
  const findings: Finding[] = [];

  for (const err of rawErrors) {
    // Classify: multi-word → grammar; single-word → spelling owns it.
    if (!/\s/.test(err.text)) continue;

    // eslint-disable-next-line security/detect-object-injection -- paragraphIndex comes from adapter we control
    const para = paragraphs[err.paragraphIndex];
    if (!para) continue;

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
      metadata: { text: err.text, offset: err.offset },
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
