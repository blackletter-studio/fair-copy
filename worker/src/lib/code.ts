// Crockford base32 alphabet — excludes I, L, O, U for human readability.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Generate a FC-XXXX-XXXX-XXXX code (60 bits of entropy). */
export function generateCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALPHABET[b % 32]);
  return `FC-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

const CODE_RE = /^FC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

/** Accepts canonical or lowercase form. */
export function isValidCodeFormat(code: string): boolean {
  return CODE_RE.test(code.toUpperCase());
}

/** Hash a code to sha256 hex; case-insensitive. */
export async function hashCode(code: string): Promise<string> {
  const normalized = code.toUpperCase();
  const encoded = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
