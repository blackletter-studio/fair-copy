import { health } from "./routes/health";
import { redeem } from "./routes/redeem";
import { mint } from "./routes/mint";

/**
 * CORS headers for browser-originated requests. The task pane at
 * https://localhost:3000 (dev) or https://word-edit.officeapps.live.com
 * (Word Online iframe) posts to /api/redeem across origins, which
 * requires an OPTIONS preflight + Access-Control-Allow-Origin on the
 * real response. Using `*` is safe here: the redeem endpoint's auth is
 * `code + email`, not the origin, and it's idempotent at the sub level.
 * The mint endpoint is CORS-restricted because it's only called from
 * the Node CLI, which bypasses preflight entirely.
 */
const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-max-age": "86400",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

/**
 * Cloudflare Worker environment bindings.
 *
 * `LICENSE_CODES` — KV namespace keyed by sha256(code). Stores metadata
 * per minted code (see `./lib/kv.ts#CodeRecord`).
 * `CONSUMED_LICENSES` — KV namespace keyed by license id (`lic_<uuid>`).
 * Stores per-license records for future admin visibility.
 * `ED25519_PRIVATE_KEY` — PKCS8 PEM for signing JWT tokens.
 * `MINT_API_KEY` — bearer token that authenticates the CLI to /api/mint.
 */
/** Shape of a Cloudflare RateLimit binding. Not yet in @cloudflare/workers-types. */
export interface RateLimit {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  LICENSE_CODES: KVNamespace;
  CONSUMED_LICENSES: KVNamespace;
  ED25519_PRIVATE_KEY: string;
  MINT_API_KEY: string;
  REDEEM_LIMIT: RateLimit;
  MINT_LIMIT: RateLimit;
}

function tooManyRequests(): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait a moment and try again.",
    }),
    { status: 429, headers: { "content-type": "application/json" } },
  );
}

/**
 * Two-layer rate limiting:
 *
 *   1. Cloudflare's native `RateLimit` binding, when present and wired.
 *      Enforced at the edge before the Worker executes — zero KV reads.
 *      Currently does not activate on wrangler 3.x free tier (the deploy
 *      output shows "Unsafe Metadata: ratelimit" rather than a real
 *      binding). The wiring is future-proofed for wrangler 4 / Workers
 *      Paid where the binding becomes authoritative.
 *
 *   2. KV-backed fixed-window counter, authoritative today. One KV read
 *      and one write per request. Race-prone by ~a few over-limit hits
 *      per window, which is fine for "defeat a code-guessing botnet"
 *      semantics. Keys are namespaced `rl:<bucket-name>:<ip>:<window>`
 *      under the existing LICENSE_CODES namespace with a TTL of 2*period
 *      so they survive clock skew + expire without accumulating.
 *
 * The binding is checked first so we get edge-cached rejection the
 * moment it starts firing (when Matt upgrades wrangler / plan).
 */
async function enforceLimit(
  request: Request,
  limiter: RateLimit | undefined,
  kv: KVNamespace,
  bucketName: string,
  limit: number,
  periodSec: number,
): Promise<Response | null> {
  const ip = request.headers.get("cf-connecting-ip") ?? "anonymous";

  // Layer 1 — native binding.
  if (typeof limiter?.limit === "function") {
    try {
      const { success } = await limiter.limit({ key: ip });
      if (!success) return tooManyRequests();
    } catch {
      // Binding present but mis-configured; fall through to KV layer.
    }
  }

  // Layer 2 — KV fixed-window counter.
  const windowId = Math.floor(Date.now() / 1000 / periodSec);
  const key = `rl:${bucketName}:${ip}:${windowId}`;
  const raw = await kv.get(key);
  const current = raw ? Number.parseInt(raw, 10) : 0;
  if (current >= limit) return tooManyRequests();
  await kv.put(key, String(current + 1), { expirationTtl: periodSec * 2 });
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight — answer with allow-all for the routes browsers hit.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return withCors(health());
    }
    if (request.method === "POST" && url.pathname === "/api/redeem") {
      const limited = await enforceLimit(
        request,
        env.REDEEM_LIMIT,
        env.LICENSE_CODES,
        "redeem",
        10,
        60,
      );
      if (limited) return withCors(limited);
      return withCors(await redeem(request, env));
    }
    if (request.method === "POST" && url.pathname === "/api/mint") {
      // Mint is only ever called from the Node CLI; CORS wrapping is
      // harmless but unnecessary. Wrap anyway so curl-from-browser-console
      // works for ad-hoc testing. Rate limit is a belt-and-suspenders
      // guard in case MINT_API_KEY ever leaks.
      const limited = await enforceLimit(
        request,
        env.MINT_LIMIT,
        env.LICENSE_CODES,
        "mint",
        30,
        60,
      );
      if (limited) return withCors(limited);
      return withCors(await mint(request, env));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
};
