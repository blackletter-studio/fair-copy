import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

/**
 * Grammar check — surfaces Word's own grammar errors.
 *
 * Detection comes from `Word.Document.grammaticalErrors` (WordApiDesktop 1.4)
 * via `DocumentAdapter.getGrammarErrorRanges()`. Word labels spelling and
 * grammar separately, so this check no longer has to classify — it just
 * passes Word's grammar-flagged ranges through.
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
  if (typeof doc.getGrammarErrorRanges !== "function") return [];
  const rawErrors = await doc.getGrammarErrorRanges();
  if (rawErrors.length === 0) return [];

  const paragraphs = doc.getAllParagraphs();
  const findings: Finding[] = [];

  for (const err of rawErrors) {
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
