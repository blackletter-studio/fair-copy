import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Miniflare } from "miniflare";
import { generateKeyPair, exportPKCS8, exportSPKI, jwtVerify, importSPKI } from "jose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashCode } from "../src/lib/code";

// Miniflare loads the pre-bundled Worker produced by `tests/globalSetup.ts`.
// Miniflare itself does not compile TypeScript, so we point it at the vite
// build artefact under `dist-test/`.
const here = path.dirname(fileURLToPath(import.meta.url));
const workerScript = path.resolve(here, "../dist-test/worker.mjs");

let mf: Miniflare;
let publicPem: string;

beforeEach(async () => {
  const kp = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  const privatePem = await exportPKCS8(kp.privateKey);
  publicPem = await exportSPKI(kp.publicKey);

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

async function seedCode(code: string, role: "paying" | "preview" = "paying") {
  const kv = await mf.getKVNamespace("LICENSE_CODES");
  const hash = await hashCode(code);
  await kv.put(
    hash,
    JSON.stringify({
      role,
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

describe("POST /api/redeem", () => {
  it("first redeem with valid code + email returns a JWT", async () => {
    await seedCode("FC-0000-0000-0001");
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "FC-0000-0000-0001",
        email: "a@example.com",
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string };
    expect(body.token).toMatch(/^eyJ/);
    const { payload } = await jwtVerify(body.token, await importSPKI(publicPem, "EdDSA"));
    expect(payload.email).toBe("a@example.com");
    expect(payload.role).toBe("paying");
  });

  it("second redeem with matching email reissues a fresh JWT (same sub)", async () => {
    await seedCode("FC-0000-0000-0002");
    const first = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "FC-0000-0000-0002",
        email: "b@example.com",
      }),
    });
    const firstToken = ((await first.json()) as { token: string }).token;
    const firstSub = (await jwtVerify(firstToken, await importSPKI(publicPem, "EdDSA"))).payload
      .sub;

    const second = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "FC-0000-0000-0002",
        email: "b@example.com",
      }),
    });
    expect(second.status).toBe(200);
    const secondToken = ((await second.json()) as { token: string }).token;
    const secondSub = (await jwtVerify(secondToken, await importSPKI(publicPem, "EdDSA"))).payload
      .sub;
    expect(secondSub).toBe(firstSub);
  });

  it("second redeem with a DIFFERENT email returns 409", async () => {
    await seedCode("FC-0000-0000-0003");
    await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "FC-0000-0000-0003",
        email: "c@example.com",
      }),
    });
    const second = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "FC-0000-0000-0003",
        email: "wrong@example.com",
      }),
    });
    expect(second.status).toBe(409);
  });

  it("unknown code returns 404", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "FC-9999-9999-9999",
        email: "x@example.com",
      }),
    });
    expect(res.status).toBe(404);
  });

  it("malformed code returns 400", async () => {
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "not-a-code", email: "x@example.com" }),
    });
    expect(res.status).toBe(400);
  });

  it("missing email returns 400", async () => {
    await seedCode("FC-0000-0000-0004");
    const res = await mf.dispatchFetch("http://localhost/api/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "FC-0000-0000-0004" }),
    });
    expect(res.status).toBe(400);
  });
});
