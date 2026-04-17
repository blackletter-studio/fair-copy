import type { Detector, DocumentAdapter, DetectionResult } from "../types";

export const documentStateDetector: Detector<"document-state"> = {
  kind: "document-state",
  detect(doc: DocumentAdapter): DetectionResult | null {
    const state = doc.getDocumentState();
    const hasAnyFlag = state.isMarkedFinal || state.isPasswordProtected || state.hasActiveComments;
    if (!hasAnyFlag) return null;
    return { kind: "document-state", count: 1, items: [state] };
  },
};
