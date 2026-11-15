import { adminClient, handle, json } from "@/lib/supabase";

/** GET /api/directory/search?country=FR&q=clinique du parc&postal=75012 — sign-up matching + "find your clinic". */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const name = (q.get("q") ?? "").trim().slice(0, 120);
  if (name.length < 3) return json({ results: [] });
  const { data, error } = await adminClient().rpc("directory_match", { p_country: (q.get("country") ?? "FR").toUpperCase(), p_name: name, p_postal: q.get("postal") || null, p_limit: 5 });
  if (error) throw error;
  return json({ results: data });
});
