import type { LicenseRole } from "./types";

/** Metadata stored for each minted code. */
export interface CodeRecord {
  role: LicenseRole;
  createdAt: number;
  createdBy: string; // Matt's identifier at mint time
  expiryOverride: number | null; // UNIX seconds, or null to use role default
  note: string | null;
  recipientEmail: string | null; // optional pre-association at mint
  consumed: boolean;
  consumedAt: number | null;
  consumedBy: string | null; // license id (sub)
  consumedByEmail: string | null; // email that redeemed
}

/** Per-license record for future admin visibility. */
export interface LicenseRecord {
  licenseId: string;
  email: string;
  role: LicenseRole;
  codeHash: string;
  firstRedeemedAt: number;
  lastReissuedAt: number;
}

export async function getCode(kv: KVNamespace, hash: string): Promise<CodeRecord | null> {
  const raw = await kv.get(hash, "json");
  return raw as CodeRecord | null;
}

export async function putCode(kv: KVNamespace, hash: string, record: CodeRecord): Promise<void> {
  await kv.put(hash, JSON.stringify(record));
}

export async function getLicense(
  kv: KVNamespace,
  licenseId: string,
): Promise<LicenseRecord | null> {
  const raw = await kv.get(licenseId, "json");
  return raw as LicenseRecord | null;
}

export async function putLicense(
  kv: KVNamespace,
  licenseId: string,
  record: LicenseRecord,
): Promise<void> {
  await kv.put(licenseId, JSON.stringify(record));
}
