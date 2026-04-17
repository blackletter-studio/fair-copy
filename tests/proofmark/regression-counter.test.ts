import { describe, it, expect } from "vitest";
import { FakeDocumentAdapter } from "../../src/engine/fake-document-adapter";
import { runChecks } from "../../src/proofmark/engine/check-engine";
import { detectRegions } from "../../src/proofmark/engine/region-detector";
import { PROOFMARK_PRESETS } from "../../src/proofmark/presets";
import { straightQuotesCheck } from "../../src/proofmark/engine/checks/straight-quotes";
import { emEnDashesCheck } from "../../src/proofmark/engine/checks/em-en-dashes";

class MemoryStore {
  private data = new Map<string, unknown>();
  get<T = unknown>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }
  async saveAsync(): Promise<void> {}
}

const MAX_FREE_CLEANS = 5;

describe("Proofmark regression — Fair Copy counter", () => {
  it("running Proofmark 3 times does not increment the Clean counter", () => {
    const store = new MemoryStore();
    store.set("counter", 0);
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello".'),
    ]);
    for (let i = 0; i < 3; i++) {
      const regions = detectRegions(adapter);
      runChecks(
        adapter,
        [straightQuotesCheck, emEnDashesCheck],
        regions,
        PROOFMARK_PRESETS.standard,
      );
    }
    expect(store.get<number>("counter")).toBe(0);
  });

  it("Proofmark still produces findings after the counter has hit MAX_FREE_CLEANS", () => {
    const store = new MemoryStore();
    store.set("counter", MAX_FREE_CLEANS);
    const adapter = new FakeDocumentAdapter([
      FakeDocumentAdapter.makeParagraph("p1", 'He said "hello".'),
    ]);
    const regions = detectRegions(adapter);
    const findings = runChecks(adapter, [straightQuotesCheck], regions, PROOFMARK_PRESETS.standard);
    expect(findings.length).toBeGreaterThan(0);
    expect(store.get<number>("counter")).toBe(MAX_FREE_CLEANS);
  });

  it("Proofmark never writes the 'counter' key on its own", () => {
    const store = new MemoryStore();
    const adapter = new FakeDocumentAdapter([FakeDocumentAdapter.makeParagraph("p1", 'text "x"')]);
    const regions = detectRegions(adapter);
    runChecks(adapter, [straightQuotesCheck], regions, PROOFMARK_PRESETS.standard);
    expect(store.get("counter")).toBeUndefined();
  });
});
