import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySettingsStore } from "../../src/settings/roaming-settings";
import {
  readCounter,
  incrementCounter,
  remainingFreeCleans,
  isTrialExhausted,
  MAX_FREE_CLEANS,
} from "../../src/settings/counter";

describe("counter", () => {
  let store: InMemorySettingsStore;

  beforeEach(() => {
    store = new InMemorySettingsStore();
  });

  it("starts at 0 when no entry exists", async () => {
    expect(await readCounter(store)).toBe(0);
    expect(await remainingFreeCleans(store)).toBe(MAX_FREE_CLEANS);
    expect(await isTrialExhausted(store)).toBe(false);
  });

  it("increments by 1 on each call up to MAX", async () => {
    for (let i = 1; i <= MAX_FREE_CLEANS; i++) {
      const next = await incrementCounter(store);
      expect(next).toBe(i);
    }
    expect(await isTrialExhausted(store)).toBe(true);
  });

  it("caps at MAX on further increments", async () => {
    for (let i = 0; i < MAX_FREE_CLEANS + 3; i++) {
      await incrementCounter(store);
    }
    expect(await readCounter(store)).toBe(MAX_FREE_CLEANS);
  });

  it("fails safe to MAX when signature is tampered", async () => {
    await incrementCounter(store);
    await incrementCounter(store);
    const entry = store.get<{ count: number; seed: string; signature: string }>("counter");
    if (entry) store.set("counter", { ...entry, count: 0 });
    expect(await readCounter(store)).toBe(MAX_FREE_CLEANS);
    expect(await isTrialExhausted(store)).toBe(true);
  });

  it("fails safe to MAX when seed is swapped", async () => {
    await incrementCounter(store);
    const entry = store.get<{ count: number; seed: string; signature: string }>("counter");
    if (entry) store.set("counter", { ...entry, seed: "cafecafecafecafecafecafecafecafe" });
    expect(await readCounter(store)).toBe(MAX_FREE_CLEANS);
  });

  it("remainingFreeCleans decrements correctly", async () => {
    expect(await remainingFreeCleans(store)).toBe(MAX_FREE_CLEANS);
    await incrementCounter(store);
    expect(await remainingFreeCleans(store)).toBe(MAX_FREE_CLEANS - 1);
  });
});
