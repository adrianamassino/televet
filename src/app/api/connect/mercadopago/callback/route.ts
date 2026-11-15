import { adminClient, handle } from "@/lib/supabase";
import { exchangeCode } from "@/lib/payments/mercadopago";
import { readState } from "@/lib/state";

export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const st = readState(q.get("state") ?? "");
  const tokens = await exchangeCode(st.country, q.get("code") ?? "", `${process.env.APP_URL}/api/connect/mercadopago/callback`);
  const db = adminClient();
  await db.from("practice_secrets").upsert({
    practice_id: st.practiceId, mp_access_token: tokens.access_token, mp_refresh_token: tokens.refresh_token,
    mp_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });
  await db.from("practices").update({ mp_user_id: String(tokens.user_id), mp_status: "active" }).eq("id", st.practiceId);
  return Response.redirect(`${process.env.APP_URL}/pro/payouts?connected=mercadopago`, 302);
});
