import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { imagesDetector } from "../../../src/engine/detectors/images";

describe("images detector", () => {
  it("returns null when no images", () => {
    const adapter = new FakeDocumentAdapter();
    expect(imagesDetector.detect(adapter)).toBeNull();
  });

  it("returns result with count and items when images exist", () => {
    const adapter = new FakeDocumentAdapter(
      [],
      [
        {
          ref: { id: "img1", kind: "run" },
          page: 1,
          width: 200,
          height: 100,
          detectedKind: "signature",
        },
        {
          ref: { id: "img2", kind: "run" },
          page: 3,
          width: 400,
          height: 300,
          detectedKind: "exhibit",
        },
      ],
    );
    const result = imagesDetector.detect(adapter);
    expect(result?.kind).toBe("images");
    expect(result?.count).toBe(2);
    expect(result?.items).toHaveLength(2);
  });
});
