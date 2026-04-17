import { SignJWT, importPKCS8 } from "jose";
import type { LicenseFeature, LicenseRole } from "./types";

export interface SignParams {
  sub: string;
  email: string;
  role: LicenseRole;
  features: LicenseFeature[];
  expiresAt: number; // UNIX seconds
  jti: string;
}

export async function signLicenseToken(privateKeyPem: string, params: SignParams): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, "EdDSA");
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    email: params.email,
    role: params.role,
    features: params.features,
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
    .setIssuer("fair-copy.blackletter.studio")
    .setSubject(params.sub)
    .setIssuedAt(now)
    .setExpirationTime(params.expiresAt)
    .setJti(params.jti)
    .sign(privateKey);
}
