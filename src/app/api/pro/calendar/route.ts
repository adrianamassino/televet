import { z } from "zod";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";

const Body = z.object({ practitionerId: z.string().uuid(), provider: z.enum(["vetup", "vetit", "petbooqz"]), token: z.string().min(6).max(300).optional() });

async function ownedPractitioner(userId: string, practitionerId: string) {
  const { data: pr } = await adminClient().from("practitioners").select("id, practices(owner_user_id)").eq("id", practitionerId).single();
  if ((pr as unknown as { practices: { owner_user_id: string } } | null)?.practices.owner_user_id !== userId) throw new HttpError(404, "not found");
}

/** POST { practitionerId, provider, token } — stores the practice-software token for that vet and activates the link ("Activer la liaison"). */
export const POST = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const b = Body.parse(await req.json());
  if (!b.token) throw new HttpError(400, "token_required");
  await ownedPractitioner(user.id, b.practitionerId);
  const db = adminClient();
  const { data: conn, error } = await db.from("calendar_connections").upsert({ practitioner_id: b.practitionerId, provider: b.provider, status: "active", last_error: null }, { onConflict: "practitioner_id,provider" }).select("id").single();
  if (error) throw new HttpError(500, error.message);
  await db.from("connection_secrets").upsert({ connection_id: conn.id, api_key: b.token });
  return json({ ok: true });
});

/** DELETE { practitionerId, provider } — disconnects. */
export const DELETE = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const b = Body.omit({ token: true }).parse(await req.json());
  await ownedPractitioner(user.id, b.practitionerId);
  await adminClient().from("calendar_connections").delete().eq("practitioner_id", b.practitionerId).eq("provider", b.provider);
  return json({ ok: true });
});
