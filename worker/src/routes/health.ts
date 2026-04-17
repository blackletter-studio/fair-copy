/**
 * Health endpoint — unauthenticated, used by uptime pings and during
 * deployment smoke tests.
 */
export function health(): Response {
  return new Response(JSON.stringify({ status: "ok", version: "0.1.0" }), {
    headers: { "content-type": "application/json" },
  });
}
