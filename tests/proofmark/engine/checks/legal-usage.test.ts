import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../../../src/engine/fake-document-adapter";
import { legalUsageCheck } from "../../../../src/proofmark/engine/checks/legal-usage";

function run(adapter: FakeDocumentAdapter) {
  return legalUsageCheck.run(adapter, null, { mode: "interactive" });
}

describe("legalUsageCheck — detection", () => {
  it("flags 'judgement' and suggests 'judgment' (US legal convention)", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The court issued its judgement."),
    ]);
    const findings = run(adapter);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.metadata?.word).toBe("judgement");
    expect(findings[0]!.suggestedText).toBe("judgment");
    expect(findings[0]!.severity).toBe("warn");
    expect(findings[0]!.confidence).toBe("high");
    expect(findings[0]!.message).toMatch(/prefer "judgment"/);
  });

  it("flags 'defendent' and suggests 'defendant'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The defendent failed to appear."),
    ]);
    const findings = run(adapter);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.suggestedText).toBe("defendant");
  });

  it("flags 'counsul' and suggests 'counsel'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Retain outside counsul as needed."),
    ]);
    const findings = run(adapter);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.suggestedText).toBe("counsel");
  });

  it("does not flag correctly-used legal terms", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph(
        "para-0",
        "The court issued its judgment and the defendant accepted counsel.",
      ),
    ]);
    const findings = run(adapter);
    expect(findings).toHaveLength(0);
  });
});

describe("legalUsageCheck — case preservation", () => {
  it("preserves Title Case in the replacement", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "Defendent failed to appear."),
    ]);
    const findings = run(adapter);
    expect(findings[0]!.suggestedText).toBe("Defendant");
  });

  it("preserves UPPER CASE in the replacement", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "THE DEFENDENT FAILED TO APPEAR."),
    ]);
    const findings = run(adapter);
    expect(findings[0]!.suggestedText).toBe("DEFENDANT");
  });

  it("preserves lowercase in the replacement", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "the defendent failed to appear."),
    ]);
    const findings = run(adapter);
    expect(findings[0]!.suggestedText).toBe("defendant");
  });
});

describe("legalUsageCheck — finding shape", () => {
  it("emits spell-ref ids so selectRange and replaceRange can target the word", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The defendent failed to appear."),
    ]);
    const findings = run(adapter);
    expect(findings[0]!.range.id).toMatch(/^spell-0-\d+-\d+$/);
    expect(findings[0]!.range.kind).toBe("run");
  });

  it("uses checkName='legal-usage' so ProofmarkPanel routes it to the Style tab", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The defendent failed to appear."),
    ]);
    const findings = run(adapter);
    expect(findings[0]!.checkName).toBe("legal-usage");
  });

  it("includes the explanatory note for pairs that have one", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The court issued its judgement."),
    ]);
    const findings = run(adapter);
    // "judgement → judgment" has note "US legal convention"
    expect(findings[0]!.message).toMatch(/US legal convention/);
  });
});

describe("legalUsageCheck — settings.mode", () => {
  it("returns [] when mode is 'off'", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The defendent failed to appear."),
    ]);
    const findings = legalUsageCheck.run(adapter, null, { mode: "off" });
    expect(findings).toHaveLength(0);
  });
});

describe("legalUsageCheck.apply", () => {
  it("calls replaceRange with the corrected spelling", () => {
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("para-0", "The defendent failed to appear."),
    ]);
    const findings = run(adapter);
    legalUsageCheck.apply(adapter, findings[0]!);
    const muts = adapter.mutationsFor("replaceRange");
    expect(muts).toHaveLength(1);
    expect(muts[0]!.ref?.id).toBe(findings[0]!.range.id);
    expect(muts[0]!.payload).toBe("defendant");
  });
});
