import { describe, it, expect } from "vitest";
import { generateCode, hashCode, isValidCodeFormat } from "../src/lib/code";

describe("generateCode", () => {
  it("returns a code matching FC-XXXX-XXXX-XXXX where X is Crockford base32", () => {
    const code = generateCode();
    expect(code).toMatch(/^FC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  });

  it("generates a different code on each call (overwhelmingly likely)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(generateCode());
    expect(set.size).toBe(100);
  });
});

describe("isValidCodeFormat", () => {
  it("accepts canonical codes", () => {
    expect(isValidCodeFormat("FC-0123-4567-89AB")).toBe(true);
  });

  it("rejects codes with disallowed characters (I, L, O, U)", () => {
    expect(isValidCodeFormat("FC-ILOU-0000-0000")).toBe(false);
  });

  it("rejects codes missing the FC prefix", () => {
    expect(isValidCodeFormat("XX-0123-4567-89AB")).toBe(false);
  });

  it("is case-insensitive on input (but canonicalises to upper)", () => {
    expect(isValidCodeFormat("fc-0123-4567-89ab")).toBe(true);
  });
});

describe("hashCode", () => {
  it("returns a stable sha256 hex digest for the same input", async () => {
    const a = await hashCode("FC-0123-4567-89AB");
    const b = await hashCode("FC-0123-4567-89AB");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is case-insensitive on input", async () => {
    const a = await hashCode("FC-0123-4567-89AB");
    const b = await hashCode("fc-0123-4567-89ab");
    expect(a).toBe(b);
  });

  it("differs for different codes", async () => {
    const a = await hashCode("FC-0123-4567-89AB");
    const b = await hashCode("FC-0123-4567-89AC");
    expect(a).not.toBe(b);
  });
});
