export interface TextReplacement {
  find: string;
  replace: string;
}

/**
 * Compute the minimal set of search-and-replace operations that transform
 * oldText into newText. Each `find` is guaranteed to be a substring of
 * oldText that is unique in oldText (so it can be unambiguously located).
 *
 * Returns an empty array if oldText === newText.
 *
 * Designed for small localized edits (single characters, short substrings).
 * Not optimal for large-scale rewrites — but that's also not our use case.
 */
export function minimalReplacements(oldText: string, newText: string): TextReplacement[] {
  if (oldText === newText) return [];

  // Common prefix length
  let prefixLen = 0;
  while (
    prefixLen < oldText.length &&
    prefixLen < newText.length &&
    oldText.charAt(prefixLen) === newText.charAt(prefixLen)
  ) {
    prefixLen++;
  }

  // Common suffix length (not overlapping with prefix)
  let suffixLen = 0;
  while (
    suffixLen < oldText.length - prefixLen &&
    suffixLen < newText.length - prefixLen &&
    oldText.charAt(oldText.length - 1 - suffixLen) ===
      newText.charAt(newText.length - 1 - suffixLen)
  ) {
    suffixLen++;
  }

  const changedOldStart = prefixLen;
  const changedOldEnd = oldText.length - suffixLen;
  const changedNewStart = prefixLen;
  const changedNewEnd = newText.length - suffixLen;

  const countOccurrences = (hay: string, needle: string): number => {
    if (needle.length === 0) return 0;
    let count = 0;
    let idx = 0;
    while ((idx = hay.indexOf(needle, idx)) !== -1) {
      count++;
      idx += needle.length;
    }
    return count;
  };

  // Expand the window [left, right) outward in oldText until oldText.slice(left, right) is unique.
  // The corresponding replace string preserves left/right context from oldText, substituting
  // only the changed core from newText.
  let left = changedOldStart;
  let right = changedOldEnd;
  const MAX = 120;

  while (right - left < MAX) {
    const find = oldText.slice(left, right);
    if (find.length > 0 && countOccurrences(oldText, find) === 1) {
      // Build the corresponding replace by substituting the changed region
      const leftContext = oldText.slice(left, changedOldStart);
      const rightContext = oldText.slice(changedOldEnd, right);
      const replaceCore = newText.slice(changedNewStart, changedNewEnd);
      const replace = leftContext + replaceCore + rightContext;
      return [{ find, replace }];
    }
    // Expand outward — alternate left/right
    if (left > 0) left--;
    else if (right < oldText.length) right++;
    else break;
    if (right < oldText.length && left === 0) right++;
  }

  // Fallback: whole-paragraph replace
  return [{ find: oldText, replace: newText }];
}
