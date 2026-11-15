import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { authUrl } from "@/lib/calendar/google";
import { signState } from "@/lib/state";

/** POST /api/calendar/google { practitionerId } → { url } Google consent screen. */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { practitionerId } = (await req.json()) as { practitionerId: string };
  const { data: pr } = await adminClient().from("practitioners").select("id, user_id, practices(owner_user_id)").eq("id", practitionerId).single();
  const owner = (pr as unknown as { practices: { owner_user_id: string } } | null)?.practices.owner_user_id;
  if (!pr || (owner !== user.id && pr.user_id !== user.id)) throw new HttpError(404, "not found");
  return json({ url: authUrl(signState({ practitionerId }), `${process.env.APP_URL}/api/calendar/google/callback`) });
});
