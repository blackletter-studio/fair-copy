import nspell, { type NSpell } from "nspell";
import { LEGAL_TERMS } from "./legal-terms";
import { LEGAL_CONFUSION } from "./legal-confusion";

// Bundle the Hunspell .aff/.dic files as strings at build time.
//
// We avoid `import("dictionary-en")` because its default loader calls
// `fs.readFile` at runtime, which doesn't exist in the Word task pane
// (a browser environment with no filesystem). We also can't `?raw`-import
// the files straight from `node_modules/dictionary-en/` because the
// package's `exports` field gates off the `.aff`/`.dic` subpaths.
//
// The pragmatic fix: vendor the two files into our source tree. They're
// tiny (~550KB total, mostly the .dic) and stable. See `dict/README.md`
// for how to refresh them when upstream publishes a new version.
import affText from "./dict/en.aff?raw";
import dicText from "./dict/en.dic?raw";

export interface SpellCheckResult {
  word: string;
  /** Character offset within the paragraph text where the word starts. */
  offset: number;
  suggestions: string[];
  /** If the word matches a known legal-confusion pair, this is the suggested correction. */
  legalConfusionFix?: string;
}

/**
 * Lazily-initialized nspell instance. Dictionary construction is synchronous
 * once we have the strings, but we still cache it so we only pay the parse
 * cost once per session.
 */
let checker: NSpell | null = null;

function loadDictionary(): NSpell {
  if (checker) return checker;
  checker = nspell({ aff: affText, dic: dicText });
  // Augment with legal terms — treat as valid words.
  for (const term of LEGAL_TERMS) {
    checker.add(term);
  }
  return checker;
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
  const checker = loadDictionary();
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
  checker = null;
}
