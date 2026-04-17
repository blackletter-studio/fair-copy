import { describe, it, expect, beforeEach } from "vitest";
import { getStoredToken, setStoredToken, clearStoredToken } from "../../src/licensing/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("token storage (localStorage fallback path)", () => {
  it("returns null when nothing stored", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("round-trips a token", () => {
    setStoredToken("abc.def.ghi");
    expect(getStoredToken()).toBe("abc.def.ghi");
  });

  it("clears to null", () => {
    setStoredToken("abc.def.ghi");
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
