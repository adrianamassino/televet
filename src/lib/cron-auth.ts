import { createPublicKey, createVerify, timingSafeEqual } from "crypto";

/**
 * Who may call the scheduled endpoints (/api/cron/*):
 * 1. the scheduled jobs of the GitHub repository, with a short-lived GitHub OIDC token (no secret to store anywhere);
 * 2. anything holding CRON_SECRET, when that variable is set (never "Bearer undefined" when it is not).
 */
const ISSUER = "https://token.actions.githubusercontent.com";
export const CRON_AUDIENCE = "televet-cron";
const REPO = process.env.CRON_GITHUB_REPO || "adrianamassino/televet";

type Jwk = { kid: string; kty: string; n: string; e: string; alg?: string };
let jwks: { at: number; keys: Jwk[] } | null = null;
async function keys(force = false): Promise<Jwk[]> {
  if (!force && jwks && Date.now() - jwks.at < 3600000) return jwks.keys;
  const r = await fetch(`${ISSUER}/.well-known/jwks`);
  if (!r.ok) throw new Error(`jwks ${r.status}`);
  jwks = { at: Date.now(), keys: ((await r.json()) as { keys: Jwk[] }).keys };
  return jwks.keys;
}
const b64 = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** Checks a GitHub Actions OIDC token: signature, issuer, audience, repository, branch, expiry. */
export async function verifyGithubOidc(token: string, now = Date.now(), getKeys = keys): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(b64(parts[0]).toString("utf8")) as { alg: string; kid: string };
    if (header.alg !== "RS256") return false;
    let jwk = (await getKeys()).find((k) => k.kid === header.kid);
    if (!jwk) jwk = (await getKeys(true)).find((k) => k.kid === header.kid); // keys rotated
    if (!jwk) return false;
    const ok = createVerify("RSA-SHA256").update(`${parts[0]}.${parts[1]}`).verify(createPublicKey({ key: jwk, format: "jwk" }), b64(parts[2]));
    if (!ok) return false;
    const c = JSON.parse(b64(parts[1]).toString("utf8")) as { iss: string; aud: string | string[]; repository: string; ref: string; exp: number; nbf?: number };
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    return c.iss === ISSUER && aud.includes(CRON_AUDIENCE) && c.repository === REPO && c.ref === "refs/heads/main"
      && c.exp * 1000 > now && (!c.nbf || c.nbf * 1000 <= now + 60000);
  } catch { return false; }
}

export function hasCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? ""), want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function isCronRequest(req: Request): Promise<boolean> {
  if (hasCronSecret(req)) return true;
  const m = /^Bearer\s+(\S+)$/.exec(req.headers.get("authorization") ?? "");
  return !!m && m[1].split(".").length === 3 && verifyGithubOidc(m[1]);
}
