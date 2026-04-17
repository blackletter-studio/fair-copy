import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Miniflare } from "miniflare";
import { generateKeyPair, exportPKCS8 } from "jose";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

/**
 * CORS regression guard. The Fair Copy task pane is served from
 * https://localhost:3000 in dev (or the Word Online iframe origin in
 * AppSource) and POSTs cross-origin to /api/redeem. Without these
 * headers the browser blocks the preflight and the user sees a
 * misleading "Couldn't reach the license server" network error.
 *
 * Learned the hard way during M4 Phase 5 dogfood — Matt's first redeem
 * attempt against the live Worker failed this exact way.
 */
describe("CORS", () => {
  it("answers OPTIONS preflight with 204 + allow-* headers", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "OPTIONS",
      headers: {
        origin: "https://localhost:3000",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    expect(res.headers.get("access-control-allow-headers")).toContain("content-type");
  });

  it("attaches access-control-allow-origin to /api/health responses", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/health", {
      method: "GET",
      headers: { origin: "https://localhost:3000" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("attaches access-control-allow-origin to /api/redeem responses (even errors)", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://localhost:3000",
      },
      body: JSON.stringify({ code: "FC-9999-9999-9999", email: "x@example.com" }),
    });
    // 404 (code not found) is the happy case here — we care that the
    // CORS header rides along so the browser surfaces the error body.
    expect(res.status).toBe(404);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});
