import type { Detector, DocumentAdapter, DetectionResult } from "../types";

export const imagesDetector: Detector<"images"> = {
  kind: "images",
  detect(doc: DocumentAdapter): DetectionResult | null {
    const imgs = doc.getAllImages();
    if (imgs.length === 0) return null;
    return { kind: "images", count: imgs.length, items: imgs };
  },
};
