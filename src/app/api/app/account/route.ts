import { randomUUID } from "node:crypto";
import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";

/**
 * DELETE /api/app/account — a pet owner deletes their account from the app (required by the App Store and Google Play).
 *  - Refused while an appointment is still to come (cancel or attend it first), and for clinic/vet accounts
 *    (they hold other people's appointments and payments: the Televet team closes those by hand).
 *  - Photos of the health booklet, pets, health records and phones are deleted.
 *  - With no appointment history the account disappears entirely. Otherwise past appointments stay, because vets and
 *    Televet must keep their accounting, but nothing identifies the person any more (name, phone, e-mail, addresses removed)
 *    and the account can never be used again.
 */
export const DELETE = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient(), uid = user.id;

  const [{ count: practices }, { count: asVet }] = await Promise.all([
    db.from("practices").select("id", { count: "exact", head: true }).eq("owner_user_id", uid),
    db.from("practitioners").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);
  if ((practices ?? 0) > 0 || (asVet ?? 0) > 0) throw new HttpError(409, "practice_account");
  const { count: upcoming } = await db.from("bookings").select("id", { count: "exact", head: true })
    .eq("owner_id", uid).in("status", ["pending", "confirmed"]).gt("ends_at", new Date().toISOString());
  if ((upcoming ?? 0) > 0) throw new HttpError(409, "upcoming_bookings");

  // 1) private photos, 2) phones
  const { data: docs } = await db.from("pet_documents").select("storage_path").eq("owner_id", uid);
  const files = (docs ?? []).map((d: { storage_path: string }) => d.storage_path).filter(Boolean);
  for (let i = 0; i < files.length; i += 100) await db.storage.from("pet-docs").remove(files.slice(i, i + 100));
  await db.from("push_tokens").delete().eq("user_id", uid);

  // 3) the account
  const { count: history } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("owner_id", uid);
  if (!history) {
    const { error } = await db.auth.admin.deleteUser(uid); // cascades: owner row, pets, health records
    if (!error) return json({ ok: true, mode: "deleted" });
    console.error("account delete", error.message);          // still referenced somewhere: anonymise instead
  }
  const { error: e1 } = await db.from("bookings").update({ pet_id: null, address: null, postal_code: null, access_notes: null }).eq("owner_id", uid);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await db.from("pets").delete().eq("owner_id", uid); // cascades health records and photo rows
  if (e2) throw new Error(e2.message);
  await db.from("owners").update({ full_name: "", phone: null }).eq("id", uid);
  const { error: e3 } = await db.auth.admin.updateUserById(uid, {
    email: `deleted-${uid}@deleted.televet.invalid`, email_confirm: true, password: `${randomUUID()}${randomUUID()}`, user_metadata: {}, ban_duration: "876000h",
  });
  if (e3) throw new Error(e3.message);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token) await db.auth.admin.signOut(token, "global").catch(() => {});
  return json({ ok: true, mode: "anonymised" });
});
