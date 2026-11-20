import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingFlow, { type SvcIn } from "@/components/BookingFlow";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";

export const metadata: Metadata = { robots: { index: false, follow: false } };
type P = { params: Promise<{ lang: string; country: string; slug: string }>; searchParams: Promise<{ service?: string; vet?: string }> };

export default async function Page({ params, searchParams }: P) {
  const { lang, country, slug } = await params;
  const { service, vet } = await searchParams;
  const c = COUNTRIES[country.toUpperCase()];
  if (!c || !c.languages.includes(lang)) notFound();
  const { data: p } = await adminClient().from("practices")
    .select("id, name, timezone, services(id, practitioner_id, type, custom_name, duration_min, price_cents, currency, online_payment, active), practitioners(id, active, approved)")
    .eq("slug", slug).eq("country", c.code).eq("published", true).maybeSingle();
  const pr = p?.practitioners?.find((x: { id: string; active: boolean; approved: boolean }) => x.active && x.approved && (!vet || x.id === vet)) ?? p?.practitioners?.find((x: { active: boolean; approved: boolean }) => x.active && x.approved);
  const services: SvcIn[] = (p?.services ?? []).filter((s: { active: boolean; practitioner_id: string | null }) => s.active && (!s.practitioner_id || s.practitioner_id === pr?.id)).map((s: { id: string; type: SvcIn["type"]; custom_name: string | null; duration_min: number; price_cents: number; currency: string; online_payment: boolean }) => ({ id: s.id, type: s.type, name: s.custom_name, duration: s.duration_min, price: s.price_cents, currency: s.currency, onlinePayment: s.online_payment }));
  if (!p || !pr || services.length === 0) notFound();
  return (
    <main className="wrap narrow">
      <BookingFlow lang={lang} country={c.code} slug={slug} practiceName={p.name} practitionerId={pr.id} timezone={p.timezone} services={services} preselect={service} stripeKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} />
    </main>
  );
}
