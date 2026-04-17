import { health } from "./routes/health";

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
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return health();
    }

    // /api/redeem and /api/mint wired in by subsequent implementation tasks.

    return new Response("Not found", { status: 404 });
  },
};
