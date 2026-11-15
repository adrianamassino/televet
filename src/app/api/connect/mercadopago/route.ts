import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { oauthUrl } from "@/lib/payments/mercadopago";
import { signState } from "@/lib/state";

/** POST /api/connect/mercadopago { practiceId } → { url } Mercado Pago OAuth consent. */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { practiceId } = (await req.json()) as { practiceId: string };
  const { data: p } = await adminClient().from("practices").select("id, owner_user_id, country").eq("id", practiceId).single();
  if (!p || p.owner_user_id !== user.id) throw new HttpError(404, "not found");
  const redirect = `${process.env.APP_URL}/api/connect/mercadopago/callback`;
  return json({ url: oauthUrl(p.country, signState({ practiceId: p.id, country: p.country }), redirect) });
});
