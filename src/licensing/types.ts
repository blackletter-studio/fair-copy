export type LicenseRole = "paying" | "friends-family" | "preview" | "partner";

export type LicenseFeature = "fair-copy";

/**
 * JWT payload shape — what the Cloudflare Worker signs and the task pane
 * verifies. Keep in sync with `fair-copy/worker/src/lib/types.ts`; the
 * duplication is intentional (avoids a monorepo-level tooling dependency
 * for four shared types).
 */
export interface LicenseToken {
  /** Issuer — always `fair-copy.blackletter.studio`. */
  iss: string;
  /** Subject — opaque license id (`lic_<uuid-v4>`). */
  sub: string;
  /** Email the user provided at redeem time. */
  email: string;
  /** Role determines expiry and (future) feature entitlements. */
  role: LicenseRole;
  /** Features unlocked by this license. */
  features: LicenseFeature[];
  /** Issued-at (UNIX seconds). */
  iat: number;
  /** Expiry (UNIX seconds). */
  exp: number;
  /** Unique token id — enables future per-token revocation. */
  jti: string;
}

/** In-memory representation consumed by the task pane UI. */
export interface LicenseContext {
  licensed: boolean;
  role: LicenseRole | null;
  features: LicenseFeature[];
  email: string | null;
  expiresAt: Date | null;
}

/** The empty/unlicensed state. */
export const UNLICENSED_CONTEXT: LicenseContext = {
  licensed: false,
  role: null,
  features: [],
  email: null,
  expiresAt: null,
};
