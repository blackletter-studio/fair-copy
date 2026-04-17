import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { legalHomophonesCheck } from "../../../../src/proofmark/engine/checks/legal-homophones";

describe("legal-homophones check", () => {
  it("flags 'counsel' vs 'council' misuse", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "The city council advised the plaintiff."),
    ]);
    const findings = legalHomophonesCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.metadata).toMatchObject({ word: "council" });
  });

  it("flags 'principal/principle'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "The principle amount was paid."),
    ]);
    const findings = legalHomophonesCheck.run(adapter, null, { mode: "interactive" });
    expect(findings.some((f) => (f.metadata as { word?: string })?.word === "principle")).toBe(true);
  });

  it("does not flag when no homophones are present", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", "Plain prose with no confusables."),
    ]);
    expect(legalHomophonesCheck.run(adapter, null, { mode: "interactive" })).toHaveLength(0);
  });

  it("is interactive by default", () => {
    expect(legalHomophonesCheck.defaultMode).toBe("interactive");
  });
});
