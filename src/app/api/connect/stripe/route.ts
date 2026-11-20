import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { createConnectedAccount, onboardingLink } from "@/lib/payments/stripe";

/** POST /api/connect/stripe { practiceId } → { url } hosted onboarding (identity, IBAN…). */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { practiceId } = (await req.json()) as { practiceId: string };
  const db = adminClient();
  const { data: p } = await db.from("practices").select("id, owner_user_id, country, email, stripe_account_id").eq("id", practiceId).single();
  if (!p || p.owner_user_id !== user.id) throw new HttpError(404, "not found");
  let accountId = p.stripe_account_id;
  if (!accountId) {
    const acct = await createConnectedAccount({ country: p.country, email: p.email ?? user.email, practiceId: p.id });
    accountId = acct.id;
    await db.from("practices").update({ stripe_account_id: accountId, stripe_status: "onboarding" }).eq("id", p.id);
  }
  const link = await onboardingLink(accountId, `${process.env.APP_URL}/${COUNTRIES[p.country]?.languages[0] ?? "en"}/${p.country.toLowerCase()}/pro/dashboard`);
  return json({ url: link.url });
});
