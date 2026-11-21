import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";

/** GET /api/pro/bookings — the signed-in vet's bookings (upcoming + last 30 days) with owner and pet details the browser can't read directly. */
export const GET = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: practice } = await db.from("practices").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!practice) return json({ bookings: [] });
  const u = new URL(req.url), okDate = (v: string | null) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
  const from = okDate(u.searchParams.get("from")), to = okDate(u.searchParams.get("to"));
  const since = from ?? new Date(Date.now() - 30 * 86400000).toISOString();
  const COLS = "id, starts_at, ends_at, type, status, address, motive, access_notes, price_cents, currency, payment_status, video_room, owners(full_name, phone), pets(name, species), services(custom_name, catalog_code)";
  const run = (cols: string) => {
    let q = db.from("bookings").select(cols).eq("practice_id", practice.id).gte("starts_at", since).order("starts_at", { ascending: true }).limit(300);
    if (to) q = q.lt("starts_at", to);
    return q;
  };
  let { data, error } = await run(`${COLS}, travel_min`); // minutes kept free before and after a home visit
  if (error) ({ data } = await run(COLS));               // database not updated yet (migration 0016)
  return json({ bookings: data ?? [] });
});
