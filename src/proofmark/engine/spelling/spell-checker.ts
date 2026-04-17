import nspell, { type NSpell } from "nspell";
import { LEGAL_TERMS } from "./legal-terms";
import { LEGAL_CONFUSION } from "./legal-confusion";

export interface SpellCheckResult {
  word: string;
  /** Character offset within the paragraph text where the word starts. */
  offset: number;
  suggestions: string[];
  /** If the word matches a known legal-confusion pair, this is the suggested correction. */
  legalConfusionFix?: string;
}

/**
 * Lazily-initialized nspell instance. Dictionary load is async (reads the
 * affix + dict files from the dictionary-en package), so we cache the
 * promise on first call.
 */
let checkerPromise: Promise<NSpell> | null = null;

function loadDictionary(): Promise<NSpell> {
  if (checkerPromise) return checkerPromise;
  checkerPromise = (async () => {
    // dictionary-en exports a default object {aff: Uint8Array, dic: Uint8Array}
    // resolved via a top-level-await ESM module.
    const dict = (await import("dictionary-en")).default;
    const checker = nspell(dict);
    // Augment with legal terms — treat as valid words.
    for (const term of LEGAL_TERMS) {
      checker.add(term);
    }
    return checker;
  })();
  return checkerPromise;
}

const WORD_RE = /[A-Za-z][A-Za-z'\u2019-]*/g;
const CONFUSION_MAP = new Map(LEGAL_CONFUSION.map((p) => [p.wrong.toLowerCase(), p.right]));

/**
 * Scan a paragraph for misspellings. Returns one SpellCheckResult per flagged
 * word. The `customDict` is merged at call time (words the user has added).
 */
export async function checkParagraph(
  text: string,
  customDict: readonly string[] = [],
): Promise<SpellCheckResult[]> {
  const checker = await loadDictionary();
  // Apply custom dict entries for this call.
  for (const w of customDict) {
    checker.add(w);
  }

  const results: SpellCheckResult[] = [];
  WORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD_RE.exec(text)) !== null) {
    const word = m[0];
    const offset = m.index;
    const lower = word.toLowerCase();

    // Legal confusion takes precedence — flag even if the spell-checker accepts it.
    const confusionFix = CONFUSION_MAP.get(lower);
    if (confusionFix !== undefined) {
      results.push({
        word,
        offset,
        suggestions: [preserveCase(word, confusionFix)],
        legalConfusionFix: preserveCase(word, confusionFix),
      });
      continue;
    }

    // Standard spell-check.
    if (!checker.correct(word)) {
      const sugg = checker.suggest(word).slice(0, 5);
      results.push({ word, offset, suggestions: sugg });
    }
  }
  return results;
}

/** If original was Title-Case or UPPER, apply same casing to the corrected word. */
function preserveCase(original: string, corrected: string): string {
  if (original === original.toUpperCase()) return corrected.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }
  return corrected;
}

/** Reset the cached checker — used in tests to start fresh. */
export function resetCheckerCache(): void {
  checkerPromise = null;
}
