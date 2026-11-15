import { handle, HttpError, json } from "@/lib/supabase";
import { searchPlaces } from "@/lib/places";

/** GET /api/places?q=palermo&country=AR&lang=es — address/city autocomplete for the search bar and checkout. */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const text = (q.get("q") ?? "").trim();
  const country = (q.get("country") ?? "FR").toUpperCase();
  if (text.length < 2) return json({ places: [] });
  if (text.length > 120) throw new HttpError(400, "query too long");
  return json({ places: await searchPlaces(text, country, q.get("lang") ?? "en") });
});
