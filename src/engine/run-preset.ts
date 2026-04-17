import type { DocumentAdapter, DetectionResult, Preset, Rule } from "./types";
import { fontFaceRule } from "./rules/font-face";
import { fontSizeRule } from "./rules/font-size";
import { coloredTextRule } from "./rules/colored-text";
import { highlightingRule } from "./rules/highlighting";
import { boldItalicUnderlineRule } from "./rules/bold-italic-underline";
import { strikethroughRule } from "./rules/strikethrough";
import { alignmentRule } from "./rules/alignment";
import { lineSpacingRule } from "./rules/line-spacing";
import { paragraphSpacingRule } from "./rules/paragraph-spacing";
import { indentsAndTabsRule } from "./rules/indents-and-tabs";
import { bulletListsRule } from "./rules/bullet-lists";
import { numberedListsRule } from "./rules/numbered-lists";
import { tablesRule } from "./rules/tables";
import { commentsRule } from "./rules/comments";
import { hyperlinksRule } from "./rules/hyperlinks";
import { sectionBreaksRule } from "./rules/section-breaks";
import { trackedChangesDetector } from "./detectors/tracked-changes";
import { imagesDetector } from "./detectors/images";
import { documentStateDetector } from "./detectors/document-state";

const RULES_IN_ORDER: Rule[] = [
  // Paragraph-level first (character-level ops see final para context)
  alignmentRule,
  lineSpacingRule,
  paragraphSpacingRule,
  indentsAndTabsRule,
  // List/table structure
  bulletListsRule,
  numberedListsRule,
  tablesRule,
  // Character-level
  fontFaceRule,
  fontSizeRule,
  coloredTextRule,
  highlightingRule,
  boldItalicUnderlineRule,
  strikethroughRule,
  // Strippers last
  commentsRule,
  hyperlinksRule,
  sectionBreaksRule,
];

export interface DestructiveDecision {
  trackedChanges?: "review" | "reject" | "leave";
  images?: "keep" | "remove" | "choose-individually" | { [imageId: string]: "keep" | "remove" };
  continueDespiteMarkedFinal?: boolean;
}

export interface RunPresetResult {
  kind: "ran" | "aborted" | "no-changes";
  detections: DetectionResult[];
  ruleCount: number;
}

export function detectDestructive(doc: DocumentAdapter): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];
  const tc = trackedChangesDetector.detect(doc);
  if (tc) results.push(tc);
  const imgs = imagesDetector.detect(doc);
  if (imgs) results.push(imgs);
  const state = documentStateDetector.detect(doc);
  if (state) results.push(state);
  return Promise.resolve(results);
}

/**
 * Run a preset against a document.
 *
 * Flow:
 *   load() → detect → (abort if detections && !decision) → apply decision → run rules → commit
 *
 * If `detections` is non-empty and `decision` is undefined, returns kind="aborted".
 * The caller must show confirmation dialogs, then re-call with `decision` populated.
 */
export async function runPreset(
  doc: DocumentAdapter,
  preset: Preset,
  decision?: DestructiveDecision,
): Promise<RunPresetResult> {
  // Phase 0: populate cache (WordDocumentAdapter only — fake ignores)
  await doc.load?.();

  // Phase 1: detect destructive conditions
  const detections = await detectDestructive(doc);

  // Phase 2: if destructive detections fired and no decision yet, abort
  if (detections.length > 0 && !decision) {
    return { kind: "aborted", detections, ruleCount: 0 };
  }

  // TODO(M2-T10): if documentState detection showed isMarkedFinal=true AND
  // decision.continueDespiteMarkedFinal !== true, abort here. Wire this when
  // the marked-final confirmation dialog lands in M2 T10.

  // Phase 3: apply destructive decisions first
  if (decision?.trackedChanges === "reject") {
    for (const tc of doc.getAllTrackedChanges()) {
      doc.rejectTrackedChange(tc.ref);
    }
  }
  if (decision?.images === "remove") {
    for (const img of doc.getAllImages()) {
      doc.removeImage(img.ref);
    }
  } else if (typeof decision?.images === "object" && decision.images !== null) {
    for (const [imgId, action] of Object.entries(decision.images)) {
      if (action === "remove") {
        const img = doc.getAllImages().find((i) => i.ref.id === imgId);
        if (img) doc.removeImage(img.ref);
      }
    }
  }

  // Phase 4: run rules in order; each reads from preset.rules[rule.name]
  let applied = 0;
  for (const rule of RULES_IN_ORDER) {
    const settings = preset.rules[rule.name];
    if (!settings) continue;
    await rule.apply(doc, settings);
    applied++;
  }

  // Phase 5: commit
  await doc.commit();

  return { kind: "ran", detections, ruleCount: applied };
}
