import { handle, HttpError, json } from "@/lib/supabase";
import { reversePlace, searchPlaces } from "@/lib/places";

/** GET /api/places?q=palermo&country=AR&lang=es — address/city autocomplete for the search bar and checkout. */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  if (q.has("lat") && q.has("lng")) { // ?lat=45.46&lng=9.19 — the address at a point picked on a map
    const lat = Number(q.get("lat")), lng = Number(q.get("lng"));
    if (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180)) throw new HttpError(400, "bad coordinates");
    return json({ place: await reversePlace(lat, lng, q.get("lang") ?? "en").catch(() => null) });
  }
  const text = (q.get("q") ?? "").trim();
  const country = (q.get("country") ?? "FR").toUpperCase();
  if (text.length < 2) return json({ places: [] });
  if (text.length > 120) throw new HttpError(400, "query too long");
  return json({ places: await searchPlaces(text, country, q.get("lang") ?? "en") });
});
