/**
 * Minimal ambient type declarations for the nspell package.
 * nspell ships no TypeScript types and @types/nspell does not exist.
 */
declare module "nspell" {
  /** An nspell checker instance. */
  export interface NSpell {
    /** Returns true if the word is spelled correctly. */
    correct(word: string): boolean;
    /** Returns an array of spelling suggestions for the given word. */
    suggest(word: string): string[];
    /** Add a word to the personal dictionary. */
    add(word: string): NSpell;
    /** Remove a word from the personal dictionary. */
    remove(word: string): NSpell;
  }

  /** A Hunspell dictionary with aff and dic data. */
  export interface Dictionary {
    aff: Buffer | Uint8Array | string;
    dic: Buffer | Uint8Array | string;
  }

  /** Factory function — constructs a new NSpell checker from a dictionary object. */
  function createChecker(dictionary: Dictionary): NSpell;
  function createChecker(
    aff: Buffer | Uint8Array | string,
    dic: Buffer | Uint8Array | string,
  ): NSpell;

  export = createChecker;
}
