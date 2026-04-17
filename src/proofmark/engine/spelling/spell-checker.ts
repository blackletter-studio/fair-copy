import nspell, { type NSpell } from "nspell";
import { LEGAL_TERMS } from "./legal-terms";

// Bundle the Hunspell .aff/.dic files as strings at build time.
//
// We avoid `import("dictionary-en")` because its default loader calls
// `fs.readFile` at runtime, which doesn't exist in the Word task pane
// (a browser environment with no filesystem). We also can't `?raw`-import
// the files straight from `node_modules/dictionary-en/` because the
// package's `exports` field gates off the `.aff`/`.dic` subpaths.
//
// The pragmatic fix: vendor the two files into our source tree. See
// `dict/README.md` for how to refresh them when upstream publishes a
// new version.
import affText from "./dict/en.aff?raw";
import dicText from "./dict/en.dic?raw";

/**
 * Lazily-initialized nspell instance. Dictionary construction is synchronous
 * once we have the strings, but we still cache it so we only pay the parse
 * cost once per session.
 *
 * ## Architectural note
 * Proofmark used to use nspell for *detection* — scanning every paragraph and
 * flagging unknown words. Users found that too aggressive: it flagged words
 * Word itself accepted (compounds like "How-To", domain proper nouns, etc.)
 * because `dictionary-en` is a smaller corpus than Word's proprietary lexicon.
 *
 * As of the Option-B pivot, detection is owned by Word via
 * `DocumentAdapter.getProofingErrorRanges()`. nspell's only remaining job is
 * *suggestion generation*: when Word flags "defendent", we call `suggest`
 * to get ["defendant", …] for the Apply button. Legal terms stay loaded
 * because they improve suggestion quality for domain-specific typos.
 */
let checker: NSpell | null = null;

function loadDictionary(): NSpell {
  if (checker) return checker;
  checker = nspell({ aff: affText, dic: dicText });
  // Augment with legal terms so suggestions for legal-domain typos
  // (e.g. "barister" → "barrister") surface correctly.
  for (const term of LEGAL_TERMS) {
    checker.add(term);
  }
  return checker;
}

/**
 * Return up to 5 suggested corrections for a word that Word has already
 * flagged as misspelled. The `customDict` is merged so user-added words are
 * included in the suggestion corpus.
 *
 * Returns [] if nspell has no good guesses (rare for genuine typos, common
 * for proper nouns).
 */
export function suggestCorrections(word: string, customDict: readonly string[] = []): string[] {
  const c = loadDictionary();
  for (const w of customDict) c.add(w);
  return c.suggest(word).slice(0, 5);
}

/** Reset the cached checker — used in tests to start fresh. */
export function resetCheckerCache(): void {
  checker = null;
}
