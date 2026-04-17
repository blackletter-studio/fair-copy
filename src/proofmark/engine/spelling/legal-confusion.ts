/**
 * Common legal-writing misspellings that generic spell-checkers miss.
 * Either Word accepts the wrong spelling (because it's a valid English
 * word used incorrectly in legal context) or the confused pair is
 * legal-specific enough that generic dictionaries don't treat it
 * precisely.
 *
 * Each entry: { wrong, right }. The check flags `wrong` and suggests `right`.
 * Case-insensitive match; preserves input case on replacement.
 */
export interface ConfusionPair {
  wrong: string;
  right: string;
  note?: string;
}

export const LEGAL_CONFUSION: readonly ConfusionPair[] = [
  { wrong: "counsul", right: "counsel" },
  { wrong: "lisence", right: "license" },
  { wrong: "licence", right: "license", note: "US legal usage (UK: 'licence')" },
  { wrong: "priviledge", right: "privilege" },
  { wrong: "occurance", right: "occurrence" },
  { wrong: "occured", right: "occurred" },
  { wrong: "accomodate", right: "accommodate" },
  { wrong: "harrassment", right: "harassment" },
  { wrong: "seperate", right: "separate" },
  { wrong: "judgement", right: "judgment", note: "US legal convention" },
  { wrong: "acknowledgement", right: "acknowledgment", note: "US legal convention" },
  { wrong: "defendent", right: "defendant" },
  { wrong: "plaintif", right: "plaintiff" },
  { wrong: "recieve", right: "receive" },
  { wrong: "recieved", right: "received" },
  { wrong: "concensus", right: "consensus" },
  { wrong: "alledged", right: "alleged" },
  { wrong: "precendent", right: "precedent" },
  { wrong: "arguement", right: "argument" },
];
