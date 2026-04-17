import { describe, it, expect } from "vitest";
import { generateKeyPair, exportPKCS8, exportSPKI, SignJWT, importPKCS8 } from "jose";
import { verifyToken } from "../../src/licensing/verify";

async function makeToken(opts: {
  sub?: string;
  email?: string;
  role?: string;
  features?: string[];
  expiresAt?: number;
  publicPem?: string;
}) {
  const kp = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  const privatePem = await exportPKCS8(kp.privateKey);
  const publicPem = await exportSPKI(kp.publicKey);
  const privateKey = await importPKCS8(privatePem, "EdDSA");
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    email: opts.email ?? "test@example.com",
    role: opts.role ?? "paying",
    features: opts.features ?? ["fair-copy"],
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
    .setIssuer("fair-copy.blackletter.studio")
    .setSubject(opts.sub ?? "lic_test")
    .setIssuedAt(now)
    .setExpirationTime(opts.expiresAt ?? now + 3600)
    .setJti("tok_x")
    .sign(privateKey);
  return { token, publicPem };
}

describe("verifyToken", () => {
  it("returns the decoded LicenseToken for a valid token", async () => {
    const { token, publicPem } = await makeToken({});
    const decoded = await verifyToken(token, publicPem);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe("lic_test");
    expect(decoded!.role).toBe("paying");
  });

  it("returns null for an expired token", async () => {
    const { token, publicPem } = await makeToken({
      expiresAt: Math.floor(Date.now() / 1000) - 10,
    });
    expect(await verifyToken(token, publicPem)).toBeNull();
  });

  it("returns null for a token signed by a different key", async () => {
    const { token } = await makeToken({});
    const { publicPem: otherPem } = await makeToken({});
    expect(await verifyToken(token, otherPem)).toBeNull();
  });

  it("returns null for garbage input", async () => {
    const { publicPem } = await makeToken({});
    expect(await verifyToken("not.a.jwt", publicPem)).toBeNull();
    expect(await verifyToken("", publicPem)).toBeNull();
  });

  it("rejects a signed token with an unknown role", async () => {
    const { token, publicPem } = await makeToken({ role: "superuser" });
    expect(await verifyToken(token, publicPem)).toBeNull();
  });

  it("rejects a signed token whose features array contains unknown values", async () => {
    const { token, publicPem } = await makeToken({ features: ["fair-copy", "wizard"] });
    expect(await verifyToken(token, publicPem)).toBeNull();
  });

  it("rejects a signed token whose features array contains non-strings", async () => {
    const { token, publicPem } = await makeToken({
      features: [42 as unknown as string],
    });
    expect(await verifyToken(token, publicPem)).toBeNull();
  });
});
