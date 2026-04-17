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
export interface Env {
  LICENSE_CODES: KVNamespace;
  CONSUMED_LICENSES: KVNamespace;
  ED25519_PRIVATE_KEY: string;
  MINT_API_KEY: string;
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
      return withCors(await redeem(request, env));
    }
    if (request.method === "POST" && url.pathname === "/api/mint") {
      // Mint is only ever called from the Node CLI; CORS wrapping is
      // harmless but unnecessary. Wrap anyway so curl-from-browser-console
      // works for ad-hoc testing.
      return withCors(await mint(request, env));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
};
