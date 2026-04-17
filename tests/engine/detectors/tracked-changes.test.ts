import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { trackedChangesDetector } from "../../../src/engine/detectors/tracked-changes";

describe("tracked-changes detector", () => {
  it("returns null when no tracked changes", () => {
    const adapter = new FakeDocumentAdapter();
    expect(trackedChangesDetector.detect(adapter)).toBeNull();
  });

  it("returns result with count and items when tracked changes exist", () => {
    const adapter = new FakeDocumentAdapter(
      [],
      [],
      [
        {
          ref: { id: "tc1", kind: "run" },
          kind: "insertion",
          author: "opposing counsel",
          date: "2026-04-15T10:00:00Z",
        },
        {
          ref: { id: "tc2", kind: "run" },
          kind: "deletion",
          author: "partner",
          date: "2026-04-15T11:00:00Z",
        },
      ],
    );
    const result = trackedChangesDetector.detect(adapter);
    expect(result?.kind).toBe("tracked-changes");
    expect(result?.count).toBe(2);
    expect(result?.items).toHaveLength(2);
  });
});
