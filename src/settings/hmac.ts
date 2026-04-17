/** Produces a hex-encoded HMAC-SHA256 signature. Uses the browser's SubtleCrypto. */
export async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(key);
  const msgBytes = enc.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  return Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time-ish equality check for hex-encoded signatures. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
