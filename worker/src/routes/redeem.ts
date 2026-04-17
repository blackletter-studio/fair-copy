import { hashCode, isValidCodeFormat } from "../lib/code";
import { getCode, putCode, getLicense, putLicense } from "../lib/kv";
import type { CodeRecord, LicenseRecord } from "../lib/kv";
import { signLicenseToken } from "../lib/token";
import type { LicenseRole } from "../lib/types";
import type { Env } from "../index";

// Role-specific default expiry. `expiryOverride` on the CodeRecord takes
// precedence over these values.
const ROLE_EXPIRY_SECONDS: Record<LicenseRole, number> = {
  paying: 365 * 24 * 60 * 60,
  "friends-family": 5 * 365 * 24 * 60 * 60,
  preview: 30 * 24 * 60 * 60,
  partner: 365 * 24 * 60 * 60,
};

function computeExpiry(role: LicenseRole, record: CodeRecord, now: number): number {
  if (record.expiryOverride !== null) return record.expiryOverride;
  // eslint-disable-next-line security/detect-object-injection
  const seconds = ROLE_EXPIRY_SECONDS[role] ?? ROLE_EXPIRY_SECONDS.paying;
  return now + seconds;
}

function randomUuid(): string {
  return crypto.randomUUID();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function redeem(request: Request, env: Env): Promise<Response> {
  let body: { code?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const code = typeof body.code === "string" ? body.code : "";
  const email = typeof body.email === "string" ? body.email : "";
  if (!code || !isValidCodeFormat(code)) {
    return jsonResponse({ error: "Invalid code format" }, 400);
  }
  if (!email || !email.includes("@")) {
    return jsonResponse({ error: "Email is required" }, 400);
  }
  const normalizedEmail = email.trim().toLowerCase();
  const hash = await hashCode(code);

  const record = await getCode(env.LICENSE_CODES, hash);
  if (!record) return jsonResponse({ error: "Code not found" }, 404);

  const now = Math.floor(Date.now() / 1000);

  // Re-redeem path — same email reissues, different email is a hard 409.
  if (record.consumed) {
    if (record.consumedByEmail !== normalizedEmail) {
      return jsonResponse(
        {
          error: "This code was redeemed by a different email. Contact support.",
        },
        409,
      );
    }
    if (record.consumedBy === null) {
      return jsonResponse({ error: "Server inconsistency; contact support." }, 500);
    }
    const token = await signLicenseToken(env.ED25519_PRIVATE_KEY, {
      sub: record.consumedBy,
      email: normalizedEmail,
      role: record.role,
      features: ["fair-copy"],
      expiresAt: computeExpiry(record.role, record, now),
      jti: randomUuid(),
    });
    const license = await getLicense(env.CONSUMED_LICENSES, record.consumedBy);
    if (license) {
      license.lastReissuedAt = now;
      await putLicense(env.CONSUMED_LICENSES, license.licenseId, license);
    }
    return jsonResponse({ token });
  }

  // First-redeem path — mint a license id, mark the code consumed, sign JWT.
  const licenseId = `lic_${randomUuid()}`;
  const updatedRecord: CodeRecord = {
    ...record,
    consumed: true,
    consumedAt: now,
    consumedBy: licenseId,
    consumedByEmail: normalizedEmail,
  };
  await putCode(env.LICENSE_CODES, hash, updatedRecord);
  const license: LicenseRecord = {
    licenseId,
    email: normalizedEmail,
    role: record.role,
    codeHash: hash,
    firstRedeemedAt: now,
    lastReissuedAt: now,
  };
  await putLicense(env.CONSUMED_LICENSES, licenseId, license);

  const token = await signLicenseToken(env.ED25519_PRIVATE_KEY, {
    sub: licenseId,
    email: normalizedEmail,
    role: record.role,
    features: ["fair-copy"],
    expiresAt: computeExpiry(record.role, record, now),
    jti: randomUuid(),
  });
  return jsonResponse({ token });
}
