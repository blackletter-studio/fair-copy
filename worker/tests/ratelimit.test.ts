import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Miniflare } from "miniflare";
import { generateKeyPair, exportPKCS8 } from "jose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashCode } from "../src/lib/code";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerScript = path.resolve(here, "../dist-test/worker.mjs");

let mf: Miniflare;

beforeEach(async () => {
  const kp = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  const privatePem = await exportPKCS8(kp.privateKey);
  mf = new Miniflare({
    modules: true,
    scriptPath: workerScript,
    kvNamespaces: ["LICENSE_CODES", "CONSUMED_LICENSES"],
    bindings: {
      ED25519_PRIVATE_KEY: privatePem,
      MINT_API_KEY: "test-mint-key",
    },
  });
});

afterEach(async () => {
  await mf.dispose();
});

async function seedCode(code: string) {
  const kv = await mf.getKVNamespace("LICENSE_CODES");
  const hash = await hashCode(code);
  await kv.put(
    hash,
    JSON.stringify({
      role: "paying",
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: "test",
      expiryOverride: null,
      note: null,
      recipientEmail: null,
      consumed: false,
      consumedAt: null,
      consumedBy: null,
      consumedByEmail: null,
    }),
  );
}

/**
 * Rate limiting regression suite — exercises the KV-backed fallback
 * that enforces the limit on any Cloudflare plan (Free, Paid, etc).
 * The native RateLimit binding is absent in Miniflare, so this is
 * the layer actually running under test.
 */
describe("rate limiting", () => {
  it("rejects the 11th /api/redeem request from a single IP within 60s", async () => {
    await seedCode("FC-RLIM-0000-0001");
    const body = JSON.stringify({
      code: "FC-RLIM-0000-0001",
      email: "rlim@example.com",
    });
    const headers = {
      "content-type": "application/json",
      "cf-connecting-ip": "198.51.100.10",
    };

    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await mf.dispatchFetch("http://localhost/api/redeem", {
        method: "POST",
        headers,
        body,
      });
      statuses.push(res.status);
    }
    // First 10 either redeem (200) or re-redeem (200) — either way, not 429.
    expect(statuses.slice(0, 10).every((s) => s !== 429)).toBe(true);
    // The 11th and 12th must be 429.
    expect(statuses[10]).toBe(429);
    expect(statuses[11]).toBe(429);
  });

  it("separates rate-limit buckets by IP (different IP unaffected)", async () => {
    await seedCode("FC-RLIM-0000-0002");
    const body = JSON.stringify({
      code: "FC-RLIM-0000-0002",
      email: "rlim-b@example.com",
    });
    // IP A exhausts its quota.
    for (let i = 0; i < 10; i++) {
      await mf.dispatchFetch("http://localhost/api/redeem", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.20" },
        body,
      });
    }
    const blocked = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.20" },
      body,
    });
    expect(blocked.status).toBe(429);

    // Different IP still gets through.
    const unaffected = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.5" },
      body,
    });
    expect(unaffected.status).not.toBe(429);
  });

  it("/api/mint is also rate-limited at 30/60s per IP", async () => {
    const headers = {
      "content-type": "application/json",
      authorization: "Bearer test-mint-key",
      "cf-connecting-ip": "198.51.100.30",
    };
    const body = JSON.stringify({ role: "preview" });

    const statuses: number[] = [];
    for (let i = 0; i < 32; i++) {
      const res = await mf.dispatchFetch("http://localhost/api/mint", {
        method: "POST",
        headers,
        body,
      });
      statuses.push(res.status);
    }
    // First 30 should succeed (200); 31st + 32nd should be 429.
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
    expect(statuses[31]).toBe(429);
  });

  it("429 responses carry CORS headers so browsers can read them", async () => {
    await seedCode("FC-RLIM-0000-0003");
    const body = JSON.stringify({
      code: "FC-RLIM-0000-0003",
      email: "rlim-c@example.com",
    });
    const headers = {
      "content-type": "application/json",
      "cf-connecting-ip": "198.51.100.40",
      origin: "https://localhost:3000",
    };
    for (let i = 0; i < 10; i++) {
      await mf.dispatchFetch("http://localhost/api/redeem", { method: "POST", headers, body });
    }
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});
