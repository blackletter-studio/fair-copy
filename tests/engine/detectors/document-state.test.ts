import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../src/engine/fake-document-adapter";
import { documentStateDetector } from "../../../src/engine/detectors/document-state";
import type { DocumentState } from "../../../src/engine/types";

describe("document-state detector", () => {
  it("returns null when all flags are false (default state)", () => {
    const adapter = new FakeDocumentAdapter();
    expect(documentStateDetector.detect(adapter)).toBeNull();
  });

  it("returns a result with count 1 when isMarkedFinal is true", () => {
    const adapter = new FakeDocumentAdapter([], [], [], {
      isMarkedFinal: true,
      isPasswordProtected: false,
      hasActiveComments: false,
      commentCount: 0,
    });
    const result = documentStateDetector.detect(adapter);
    expect(result?.kind).toBe("document-state");
    expect(result?.count).toBe(1);
    expect(result?.items).toHaveLength(1);
    expect((result?.items[0] as DocumentState).isMarkedFinal).toBe(true);
  });

  it("preserves commentCount in items when hasActiveComments is true", () => {
    const adapter = new FakeDocumentAdapter([], [], [], {
      isMarkedFinal: false,
      isPasswordProtected: false,
      hasActiveComments: true,
      commentCount: 3,
    });
    const result = documentStateDetector.detect(adapter);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(1);
    const state = result?.items[0] as DocumentState;
    expect(state.hasActiveComments).toBe(true);
    expect(state.commentCount).toBe(3);
  });

  it("returns a single result (count 1) when multiple flags are true", () => {
    const adapter = new FakeDocumentAdapter([], [], [], {
      isMarkedFinal: true,
      isPasswordProtected: true,
      hasActiveComments: true,
      commentCount: 2,
    });
    const result = documentStateDetector.detect(adapter);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(1);
    expect(result?.items).toHaveLength(1);
  });
});
