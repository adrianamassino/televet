/**
 * Mercado Pago — Split Payments 1:1 (marketplace) for AR, UY, CL, MX, BR.
 * Each vet links their Mercado Pago account through OAuth; payments are created
 * with the vet's access token and Televet's commission is set in `marketplace_fee`.
 * Docs: https://www.mercadopago.com.ar/developers/en/docs/split-payments
 */
const API = "https://api.mercadopago.com";

function creds(country: string) {
  const id = process.env[`MP_CLIENT_ID_${country}`], secret = process.env[`MP_CLIENT_SECRET_${country}`];
  if (!id || !secret) throw new Error(`Mercado Pago not configured for ${country}`);
  return { id, secret };
}

const AUTH_HOST: Record<string, string> = {
  AR: "auth.mercadopago.com.ar", UY: "auth.mercadopago.com.uy", CL: "auth.mercadopago.cl",
  MX: "auth.mercadopago.com.mx", BR: "auth.mercadopago.com.br",
};

export function oauthUrl(country: string, state: string, redirectUri: string): string {
  const u = new URL(`https://${AUTH_HOST[country] ?? "auth.mercadopago.com"}/authorization`);
  u.searchParams.set("client_id", creds(country).id);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("platform_id", "mp");
  u.searchParams.set("state", state);
  u.searchParams.set("redirect_uri", redirectUri);
  return u.toString();
}

export interface MpTokens { access_token: string; refresh_token: string; user_id: number; expires_in: number }

async function mp<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago ${path} ${res.status}: ${JSON.stringify(body)}`);
  return body as T;
}

export function exchangeCode(country: string, code: string, redirectUri: string) {
  const c = creds(country);
  return mp<MpTokens>("/oauth/token", {
    method: "POST",
    body: JSON.stringify({ client_id: c.id, client_secret: c.secret, grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
}

export function refreshTokens(country: string, refreshToken: string) {
  const c = creds(country);
  return mp<MpTokens>("/oauth/token", {
    method: "POST",
    body: JSON.stringify({ client_id: c.id, client_secret: c.secret, grant_type: "refresh_token", refresh_token: refreshToken }),
  });
}

/** Checkout Pro preference created with the vet's token; Televet keeps marketplace_fee. */
export function createPreference(p: {
  sellerToken: string; bookingId: string; title: string; amount: number; currency: string;
  marketplaceFee: number; appUrl: string; payerEmail?: string; fromApp?: boolean;
}) {
  const back = (paid: string) => `${p.appUrl}/booking/${p.bookingId}?paid=${paid}${p.fromApp ? "&app=1" : ""}`;
  return mp<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    token: p.sellerToken,
    headers: { "X-Idempotency-Key": `booking-${p.bookingId}` },
    body: JSON.stringify({
      items: [{ id: p.bookingId, title: p.title, quantity: 1, unit_price: p.amount, currency_id: p.currency }],
      marketplace_fee: p.marketplaceFee,
      external_reference: p.bookingId,
      payer: p.payerEmail ? { email: p.payerEmail } : undefined,
      notification_url: `${p.appUrl}/api/webhooks/mercadopago`,
      back_urls: { success: back("1"), failure: back("0"), pending: back("pending") },
      auto_return: "approved",
      // Cash methods settle in days: excluded for same-week appointments.
      payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
    }),
  });
}

export const getPayment = (sellerToken: string, id: string) =>
  mp<{ id: number; status: string; external_reference: string }>(`/v1/payments/${id}`, { token: sellerToken });

/** Full refund (used when the vet declines). */
export const refund = (sellerToken: string, paymentId: string) =>
  mp(`/v1/payments/${paymentId}/refunds`, { method: "POST", token: sellerToken, body: "{}" });
