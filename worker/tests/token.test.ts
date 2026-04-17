import { describe, it, expect } from "vitest";
import { generateKeyPair, exportPKCS8, exportSPKI, jwtVerify, importSPKI } from "jose";
import { signLicenseToken } from "../src/lib/token";

async function freshKeys() {
  const kp = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  const privatePem = await exportPKCS8(kp.privateKey);
  const publicPem = await exportSPKI(kp.publicKey);
  return { privatePem, publicPem };
}

describe("signLicenseToken", () => {
  it("produces a JWT verifiable with the matching public key", async () => {
    const { privatePem, publicPem } = await freshKeys();
    const jwt = await signLicenseToken(privatePem, {
      sub: "lic_test",
      email: "test@example.com",
      role: "paying",
      features: ["fair-copy"],
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      jti: "tok_abc",
    });
    const publicKey = await importSPKI(publicPem, "EdDSA");
    const { payload } = await jwtVerify(jwt, publicKey);
    expect(payload.sub).toBe("lic_test");
    expect(payload.email).toBe("test@example.com");
    expect(payload.role).toBe("paying");
  });

  it("sets iss to fair-copy.blackletter.studio", async () => {
    const { privatePem, publicPem } = await freshKeys();
    const jwt = await signLicenseToken(privatePem, {
      sub: "lic_test",
      email: "test@example.com",
      role: "preview",
      features: ["fair-copy"],
      expiresAt: Math.floor(Date.now() / 1000) + 600,
      jti: "tok_x",
    });
    const publicKey = await importSPKI(publicPem, "EdDSA");
    const { payload } = await jwtVerify(jwt, publicKey);
    expect(payload.iss).toBe("fair-copy.blackletter.studio");
  });
});
