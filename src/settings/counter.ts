import type { SettingsStore } from "./roaming-settings";
import { hmacSha256, safeEqualHex } from "./hmac";

export const MAX_FREE_CLEANS = 5;

const COUNTER_KEY = "counter";
const SEED_KEY = "counter-seed";

interface CounterEntry {
  count: number;
  seed: string;
  signature: string;
}

function generateSeed(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(seed: string, count: number): Promise<string> {
  return hmacSha256(seed, `${seed}:${count}`);
}

/** Read the counter. Fails safe to MAX on tamper. */
export async function readCounter(store: SettingsStore): Promise<number> {
  const entry = store.get<CounterEntry>(COUNTER_KEY);
  if (!entry) return 0;
  const expected = await sign(entry.seed, entry.count);
  if (!safeEqualHex(expected, entry.signature)) {
    return MAX_FREE_CLEANS;
  }
  return Math.min(Math.max(0, entry.count), MAX_FREE_CLEANS);
}

/** Increment the counter. No-op if already at MAX. */
export async function incrementCounter(store: SettingsStore): Promise<number> {
  const current = await readCounter(store);
  if (current >= MAX_FREE_CLEANS) return MAX_FREE_CLEANS;
  const seed = store.get<string>(SEED_KEY) ?? generateSeed();
  store.set(SEED_KEY, seed);
  const newCount = current + 1;
  const signature = await sign(seed, newCount);
  store.set<CounterEntry>(COUNTER_KEY, { count: newCount, seed, signature });
  await store.saveAsync();
  return newCount;
}

export async function remainingFreeCleans(store: SettingsStore): Promise<number> {
  const current = await readCounter(store);
  return Math.max(0, MAX_FREE_CLEANS - current);
}

export async function isTrialExhausted(store: SettingsStore): Promise<boolean> {
  return (await readCounter(store)) >= MAX_FREE_CLEANS;
}
