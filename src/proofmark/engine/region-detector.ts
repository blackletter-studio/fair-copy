import type { DocumentAdapter } from "../../engine/types";
import type { Region } from "./types";

/**
 * Pure pass over the document. Returns structural regions detected via
 * heading style + first-line text patterns. Extended one region kind per
 * task (Tasks 13–17).
 */
export function detectRegions(doc: DocumentAdapter): Region[] {
  const regions: Region[] = [];
  const paragraphs = doc.getAllParagraphs();
  if (paragraphs.length === 0) return regions;
  return regions;
}
