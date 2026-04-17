import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Miniflare } from "miniflare";
import { generateKeyPair, exportPKCS8 } from "jose";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Miniflare loads the pre-bundled Worker produced by `tests/globalSetup.ts`.
// See redeem.test.ts for the rationale.
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

describe("POST /api/mint", () => {
  it("returns 401 without the mint key header", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/mint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "paying" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 with the wrong mint key", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/mint", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong-key",
      },
      body: JSON.stringify({ role: "paying" }),
    });
    expect(res.status).toBe(403);
  });

  it("mints a single code with the correct mint key", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/mint", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-mint-key",
      },
      body: JSON.stringify({ role: "paying" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { codes: string[] };
    expect(body.codes).toHaveLength(1);
    expect(body.codes[0]).toMatch(/^FC-/);
  });

  it("mints multiple codes when count > 1", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/mint", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-mint-key",
      },
      body: JSON.stringify({ role: "friends-family", count: 3 }),
    });
    const body = (await res.json()) as { codes: string[] };
    expect(body.codes).toHaveLength(3);
  });

  it("rejects unknown roles with 400", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/mint", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-mint-key",
      },
      body: JSON.stringify({ role: "superuser" }),
    });
    expect(res.status).toBe(400);
  });
});
