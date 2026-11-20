import { adminClient, handle, json } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import { nextSlot } from "@/lib/next-slot";

export const dynamic = "force-dynamic";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** GET /api/app/practices?country=IT&q=milano&type=video — published clinics and vets for the owners' app (same rules as the website search). */
export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const cc = (sp.get("country") ?? "FR").toUpperCase();
  if (!COUNTRIES[cc]) return json({ practices: [] });
  const q = (sp.get("q") ?? "").trim().slice(0, 80), type = ["home", "video", "clinic"].includes(sp.get("type") ?? "") ? sp.get("type")! : "";
  const { data, error } = await adminClient().from("practices")
    .select("id, name, slug, kind, headline, address, postal_code, city, logo_url, timezone, booking_enabled, services(type, active)")
    .eq("country", cc).eq("published", true).order("name").limit(300);
  if (error) throw new Error(error.message);
  type Row = { id: string; name: string; slug: string; kind: string; headline: string | null; address: string | null; postal_code: string | null; city: string | null; logo_url: string | null; timezone: string; booking_enabled: boolean | null; services: { type: string; active: boolean }[] | null };
  const list = ((data ?? []) as Row[]).filter((p) => {
    const types = (p.services ?? []).filter((s) => s.active).map((s) => s.type);
    return (!type || types.includes(type)) && (!q || norm([p.name, p.city, p.address, p.postal_code].filter(Boolean).join(" ")).includes(norm(q)));
  }).slice(0, 60);
  const slots = await Promise.all(list.slice(0, 12).map((p) => (p.booking_enabled === false ? null : nextSlot(p.id, p.timezone, type || undefined))));
  return json({
    practices: list.map((p, i) => ({
      id: p.id, name: p.name, slug: p.slug, kind: p.kind, headline: p.headline, city: p.city, address: p.address, postalCode: p.postal_code, logoUrl: p.logo_url, timezone: p.timezone,
      types: [...new Set((p.services ?? []).filter((s) => s.active).map((s) => s.type))], bookable: p.booking_enabled !== false, nextSlot: slots[i]?.start ?? null,
    })),
  });
});
