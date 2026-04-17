import { describe, it, expect } from "vitest";
import { hmacSha256, safeEqualHex } from "../../src/settings/hmac";

describe("hmacSha256", () => {
  it("produces a deterministic 64-char hex signature", async () => {
    const a = await hmacSha256("secret", "hello");
    const b = await hmacSha256("secret", "hello");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(a)).toBe(true);
  });

  it("produces different signatures for different messages", async () => {
    const a = await hmacSha256("secret", "hello");
    const b = await hmacSha256("secret", "goodbye");
    expect(a).not.toBe(b);
  });

  it("produces different signatures for different keys", async () => {
    const a = await hmacSha256("key1", "hello");
    const b = await hmacSha256("key2", "hello");
    expect(a).not.toBe(b);
  });
});

describe("safeEqualHex", () => {
  it("returns true for identical strings", () => {
    expect(safeEqualHex("deadbeef", "deadbeef")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeEqualHex("deadbeef", "cafebabe")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(safeEqualHex("deadbeef", "dead")).toBe(false);
  });
});
