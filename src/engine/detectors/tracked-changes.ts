import type { Detector, DocumentAdapter, DetectionResult } from "../types";

export const trackedChangesDetector: Detector<"tracked-changes"> = {
  kind: "tracked-changes",
  detect(doc: DocumentAdapter): DetectionResult | null {
    const tcs = doc.getAllTrackedChanges();
    if (tcs.length === 0) return null;
    return { kind: "tracked-changes", count: tcs.length, items: tcs };
  },
};
