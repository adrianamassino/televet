import { createHmac, timingSafeEqual } from "crypto";
/** Signed OAuth `state` so callbacks can trust which practice/practitioner started the flow. */
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
export function signState(payload: Record<string, string>): string {
  const body = Buffer.from(JSON.stringify({ ...payload, t: Date.now() })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function readState(state: string, maxAgeMs = 15 * 60000): Record<string, string> {
  const [body, sig] = state.split(".");
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error("bad state");
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (Date.now() - data.t > maxAgeMs) throw new Error("expired state");
  return data;
}
