import { generateCode, hashCode } from "../lib/code";
import { putCode } from "../lib/kv";
import type { CodeRecord } from "../lib/kv";
import type { Env } from "../index";
import type { LicenseRole } from "../lib/types";

const VALID_ROLES: LicenseRole[] = ["paying", "friends-family", "preview", "partner"];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * POST /api/mint
 *
 * Authenticated via `Authorization: Bearer <MINT_API_KEY>`. Mints one or
 * more license codes for the given role and stores hashed CodeRecords in
 * the `LICENSE_CODES` KV namespace. Returns the plaintext codes once; the
 * server never retains them.
 */
export async function mint(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("authorization");
  if (!auth) return jsonResponse({ error: "Missing authorization" }, 401);
  const token = auth.replace(/^Bearer\s+/, "");
  if (token !== env.MINT_API_KEY) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  let body: {
    role?: unknown;
    count?: unknown;
    expiryOverride?: unknown;
    note?: unknown;
    recipientEmail?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const role = body.role as LicenseRole;
  if (!VALID_ROLES.includes(role)) {
    return jsonResponse({ error: "Invalid role" }, 400);
  }
  const count = typeof body.count === "number" ? Math.floor(body.count) : 1;
  if (count < 1 || count > 100) {
    return jsonResponse({ error: "count must be 1-100" }, 400);
  }
  const expiryOverride =
    typeof body.expiryOverride === "number" ? Math.floor(body.expiryOverride) : null;
  const note = typeof body.note === "string" ? body.note : null;
  const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail : null;

  const now = Math.floor(Date.now() / 1000);
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const hash = await hashCode(code);
    const record: CodeRecord = {
      role,
      createdAt: now,
      createdBy: "cli",
      expiryOverride,
      note,
      recipientEmail,
      consumed: false,
      consumedAt: null,
      consumedBy: null,
      consumedByEmail: null,
    };
    await putCode(env.LICENSE_CODES, hash, record);
    codes.push(code);
  }
  return jsonResponse({ codes });
}
