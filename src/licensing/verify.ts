import { jwtVerify, importSPKI } from "jose";
import type { LicenseFeature, LicenseRole, LicenseToken } from "./types";

/**
 * Valid role/feature values. Tokens whose `role` or `features` array contains
 * anything outside these membership sets are rejected — even if jose's
 * signature check passed. Defence in depth against a tampered or bit-rotted
 * token reaching the task-pane UI.
 */
const VALID_ROLES: readonly LicenseRole[] = ["paying", "friends-family", "preview", "partner"];
const VALID_FEATURES: readonly LicenseFeature[] = ["fair-copy"];

function isLicenseRole(v: unknown): v is LicenseRole {
  return typeof v === "string" && (VALID_ROLES as readonly string[]).includes(v);
}

function isLicenseFeatureArray(v: unknown): v is LicenseFeature[] {
  return (
    Array.isArray(v) &&
    v.every(
      (entry): entry is LicenseFeature =>
        typeof entry === "string" && (VALID_FEATURES as readonly string[]).includes(entry),
    )
  );
}

export async function verifyToken(jwt: string, publicKeyPem: string): Promise<LicenseToken | null> {
  if (!jwt) return null;
  try {
    const publicKey = await importSPKI(publicKeyPem, "EdDSA");
    const { payload } = await jwtVerify(jwt, publicKey, {
      issuer: "fair-copy.blackletter.studio",
    });
    if (
      typeof payload.iss === "string" &&
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      isLicenseRole(payload.role) &&
      isLicenseFeatureArray(payload.features) &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.jti === "string"
    ) {
      return {
        iss: payload.iss,
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        features: payload.features,
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
