import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { checklist } from "@/lib/onboarding";

/** GET /api/pro/onboarding → what the signed-in vet still has to set up. */
export const GET = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: p } = await db.from("practices").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
  if (!p) return json({ practiceId: null, missing: [] });
  return json({ practiceId: p.id, missing: (await checklist(db, p.id)).get(p.id) ?? [] });
});
