import { jwtVerify, importSPKI } from "jose";
import type { LicenseToken } from "./types";

export async function verifyToken(jwt: string, publicKeyPem: string): Promise<LicenseToken | null> {
  if (!jwt) return null;
  try {
    const publicKey = await importSPKI(publicKeyPem, "EdDSA");
    const { payload } = await jwtVerify(jwt, publicKey, {
      issuer: "fair-copy.blackletter.studio",
    });
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string" &&
      Array.isArray(payload.features) &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.jti === "string"
    ) {
      return {
        iss: payload.iss ?? "fair-copy.blackletter.studio",
        sub: payload.sub,
        email: payload.email,
        role: payload.role as LicenseToken["role"],
        features: payload.features as LicenseToken["features"],
        iat: payload.iat,
        exp: payload.exp,
        jti: payload.jti,
      };
    }
    return null;
  } catch {
    return null;
  }
}
