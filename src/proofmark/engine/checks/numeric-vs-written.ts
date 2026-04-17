import type { DocumentAdapter } from "../../../engine/types";
import type { Check, CheckSettings, Finding, Region } from "../types";

const SMALL_WORD_TO_DIGIT: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

// Inverse mapping: digit → word.
const DIGIT_TO_WORD: Record<string, string> = Object.fromEntries(
  Object.entries(SMALL_WORD_TO_DIGIT).map(([word, digit]) => [digit, word]),
);

const SMALL_DIGIT_PATTERN = /\b([1-9])\b/;
const SMALL_DIGIT_GLOBAL = /\b([1-9])\b/g;

/** Replace standalone digits 1-9 in the text with their written form. */
function spellSmallDigits(text: string): string {
  return text.replace(SMALL_DIGIT_GLOBAL, (_, d: string) => DIGIT_TO_WORD[d] ?? d);
}

export const numericVsWrittenCheck: Check = {
  name: "numeric-vs-written",
  category: "semantic",
  defaultMode: "interactive",
  run(doc: DocumentAdapter, _region: Region | null, settings: CheckSettings): Finding[] {
    if (settings.mode === "off") return [];
    const paragraphs = doc.getAllParagraphs();
    const writtenHits = new Set<string>();
    const digitHits: Array<{ paragraph: (typeof paragraphs)[number]; digit: string }> = [];
    for (const para of paragraphs) {
      for (const word of Object.keys(SMALL_WORD_TO_DIGIT)) {
        const re = new RegExp(`\\b${word}\\b`, "i");
        if (re.test(para.text)) {
          writtenHits.add(SMALL_WORD_TO_DIGIT[word] ?? "");
        }
      }
      const m = SMALL_DIGIT_PATTERN.exec(para.text);
      if (m && m[1]) digitHits.push({ paragraph: para, digit: m[1] });
    }
    if (writtenHits.size === 0 || digitHits.length === 0) return [];
    const findings: Finding[] = [];
    for (const { paragraph, digit } of digitHits) {
      const suggested = spellSmallDigits(paragraph.text);
      findings.push({
        id: `numeric-vs-written::${paragraph.ref.id}::${digit}`,
        checkName: "numeric-vs-written",
        region: "document",
        range: paragraph.ref,
        excerpt: paragraph.text.slice(0, 140),
        severity: "info",
        confidence: "low",
        message: `Small number "${digit}" appears as a digit; another paragraph uses the written form. Consider spelling numbers under 10.`,
        suggestedText: suggested !== paragraph.text ? suggested : undefined,
        metadata: { digit },
      });
    }
    return findings;
  },
  apply(doc: DocumentAdapter, finding: Finding): void {
    if (finding.suggestedText === undefined) return;
    doc.setParagraphText(finding.range, finding.suggestedText);
  },
};
