import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";

/** GET /api/pro/bookings — the signed-in vet's bookings (upcoming + last 30 days) with owner and pet details the browser can't read directly. */
export const GET = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: practice } = await db.from("practices").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!practice) return json({ bookings: [] });
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await db.from("bookings")
    .select("id, starts_at, ends_at, type, status, address, motive, access_notes, price_cents, currency, payment_status, video_room, owners(full_name, phone), pets(name, species), services(custom_name, catalog_code)")
    .eq("practice_id", practice.id).gte("starts_at", since).order("starts_at", { ascending: true }).limit(300);
  return json({ bookings: data ?? [] });
});
