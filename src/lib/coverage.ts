import { adminClient } from "./supabase";

/** How many published practices offer each service, per country. Cached for 10 minutes. */
export type Coverage = Record<string, { video: number; home: number; clinic: number }>;
let cache: { at: number; data: Coverage } | null = null;

/** null = unknown (database error). An empty object = nothing published yet (pre-launch). */
export async function getCoverage(): Promise<Coverage | null> {
  if (cache && Date.now() - cache.at < 600_000) return cache.data;
  try {
    const { data, error } = await adminClient().from("practices").select("country, services!inner(type, active)").eq("published", true).eq("services.active", true);
    if (error) throw error;
    const out: Coverage = {};
    for (const p of data ?? []) {
      const c = (out[p.country] ??= { video: 0, home: 0, clinic: 0 });
      for (const t of new Set((p.services as { type: string }[]).map((x) => x.type))) if (t === "video" || t === "home" || t === "clinic") c[t]++;
    }
    cache = { at: Date.now(), data: out };
    return out;
  } catch (e) { console.error("coverage", e); return null; }
}
