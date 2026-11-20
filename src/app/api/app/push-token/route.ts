import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";
import { isExpoToken } from "@/lib/push-copy";

const Body = z.object({ token: z.string().max(200), app: z.enum(["owner", "vet"]), platform: z.enum(["ios", "android"]), language: z.string().max(12).optional() });

/** POST /api/app/push-token — the app registers this phone for notifications (called after sign-in, and again at each start). */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const b = Body.safeParse(await req.json().catch(() => ({})));
  if (!b.success || !isExpoToken(b.data.token)) throw new HttpError(400, "invalid token");
  // a phone belongs to whoever signed in last on it: the row moves to this user
  const { error } = await adminClient().from("push_tokens").upsert(
    { token: b.data.token, user_id: user.id, app: b.data.app, platform: b.data.platform, language: (b.data.language ?? "en").slice(0, 2).toLowerCase(), updated_at: new Date().toISOString() },
    { onConflict: "token" });
  if (error) throw new Error(error.message);
  return json({ ok: true });
});

/** DELETE /api/app/push-token — sign-out: this phone stops receiving the account's notifications. */
export const DELETE = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!isExpoToken(token)) throw new HttpError(400, "invalid token");
  await adminClient().from("push_tokens").delete().eq("token", token).eq("user_id", user.id);
  return json({ ok: true });
});
