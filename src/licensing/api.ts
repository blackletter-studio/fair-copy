const DEFAULT_URL = "https://fair-copy.blackletter.studio";

export interface RedeemSuccess {
  ok: true;
  token: string;
}
export interface RedeemFailure {
  ok: false;
  status: number;
  message: string;
}
export type RedeemResult = RedeemSuccess | RedeemFailure;

export async function redeemCode(
  code: string,
  email: string,
  baseUrl: string = DEFAULT_URL,
): Promise<RedeemResult> {
  try {
    const res = await fetch(`${baseUrl}/api/redeem`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, email }),
    });
    if (res.ok) {
      const body = (await res.json()) as { token: string };
      return { ok: true, token: body.token };
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false,
      status: res.status,
      message: body.error ?? `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}
