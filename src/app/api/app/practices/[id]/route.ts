import { adminClient, handle, HttpError, json } from "@/lib/supabase";
import { clientPricer } from "@/lib/client-price";
import { providerFor } from "@/lib/payments";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/app/practices/:id[?vet=<practitioner id>] — public profile for the owners' app: clinic, approved vets, bookable services.
 * Prices are the ones the client pays (vet's price + Televet's fixed fee when that rule applies); with ?vet= they are exact for that vet.
 */
export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const vetId = new URL(req.url).searchParams.get("vet");
  if (!UUID.test(id)) throw new HttpError(404, "not found");
  const db = adminClient();
  const { data: p } = await db.from("practices")
    .select("id, name, slug, kind, headline, about, address, postal_code, city, phone, logo_url, cover_url, languages, species, timezone, country, booking_enabled, stripe_status, mp_status, commission_pct, commission_fixed_cents, services(id, type, practitioner_id, custom_name, description, duration_min, price_cents, currency, online_payment, active), practitioners(id, approved, active, title, display_name, photo_url, specialties, commission_pct, commission_fixed_cents)")
    .eq("id", id).eq("published", true).maybeSingle();
  if (!p) throw new HttpError(404, "not found");
  type Vet = { id: string; approved: boolean; active: boolean; title: string | null; display_name: string; photo_url: string | null; specialties: string[] | null; commission_pct: number | null; commission_fixed_cents: number | null };
  type Svc = { id: string; type: string; practitioner_id: string | null; custom_name: string | null; description: string | null; duration_min: number; price_cents: number; currency: string; online_payment: boolean; active: boolean };
  const vets = ((p.practitioners ?? []) as Vet[]).filter((v) => v.active && v.approved);
  const vet = vetId ? vets.find((v) => v.id === vetId) ?? null : null;
  if (vetId && !vet) throw new HttpError(404, "vet not found");
  const priceOf = await clientPricer(db, p);
  const provider = providerFor(p.country);
  const services = ((p.services ?? []) as Svc[])
    .filter((s) => s.active && (!s.practitioner_id || vets.some((v) => v.id === s.practitioner_id)) && (!vet || !s.practitioner_id || s.practitioner_id === vet.id))
    .map((s) => {
      const rule = s.practitioner_id ? vets.find((v) => v.id === s.practitioner_id) : vet; // whose commission rule applies
      return { id: s.id, vetId: s.practitioner_id, type: s.type, name: s.custom_name, description: s.description, duration: s.duration_min, price: s.online_payment ? priceOf(s.price_cents, rule) : s.price_cents, currency: s.currency, onlinePayment: s.online_payment };
    })
    .sort((a, b) => a.price - b.price);
  return json({
    practice: {
      id: p.id, name: p.name, slug: p.slug, kind: p.kind, headline: p.headline, about: p.about, address: p.address, postalCode: p.postal_code, city: p.city, phone: p.phone,
      logoUrl: p.logo_url, coverUrl: p.cover_url, languages: p.languages ?? [], species: p.species ?? [], timezone: p.timezone, country: p.country,
      bookable: p.booking_enabled !== false, provider, paymentsReady: provider === "stripe" ? p.stripe_status === "active" : p.mp_status === "active",
    },
    vets: vets.map((v) => ({ id: v.id, name: [v.title, v.display_name].filter(Boolean).join(" "), photoUrl: v.photo_url, specialties: v.specialties ?? [] })),
    services,
  });
});
