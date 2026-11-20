import { adminClient, handle, HttpError, json, userFromRequest } from "@/lib/supabase";

/** GET /api/pro/clients — everyone who booked with the signed-in vet's practice: pets, appointment types, amount spent. */
export const GET = handle(async (req) => {
  const user = await userFromRequest(req);
  if (!user) throw new HttpError(401, "sign in required");
  const db = adminClient();
  const { data: practice } = await db.from("practices").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!practice) return json({ clients: [] });
  const { data } = await db.from("bookings")
    .select("id, owner_id, starts_at, type, status, price_cents, currency, payment_status, owners(full_name, phone), pets(name, species)")
    .eq("practice_id", practice.id).not("status", "in", "(declined,cancelled)").order("starts_at", { ascending: false }).limit(5000);
  type Row = { owner_id: string; starts_at: string; type: string; price_cents: number; currency: string; payment_status: string; owners: { full_name: string; phone: string | null } | null; pets: { name: string; species: string } | null };
  const by = new Map<string, { id: string; name: string; phone: string; email: string; pets: Record<string, string>; visits: number; types: Record<string, number>; spent: Record<string, number>; last: string }>();
  for (const b of (data ?? []) as unknown as Row[]) {
    const c = by.get(b.owner_id) ?? by.set(b.owner_id, { id: b.owner_id, name: b.owners?.full_name ?? "", phone: b.owners?.phone ?? "", email: "", pets: {}, visits: 0, types: {}, spent: {}, last: b.starts_at }).get(b.owner_id)!;
    c.visits++; c.types[b.type] = (c.types[b.type] ?? 0) + 1;
    if (b.pets?.name) c.pets[b.pets.name] = b.pets.species;
    if (b.payment_status === "captured") c.spent[b.currency] = (c.spent[b.currency] ?? 0) + b.price_cents;
    if (b.starts_at > c.last) c.last = b.starts_at;
  }
  // e-mail of each client (an owner is an auth user); only for this vet's own clients
  await Promise.all([...by.values()].map(async (c) => { const { data: u } = await db.auth.admin.getUserById(c.id); c.email = u.user?.email ?? ""; }));
  return json({ clients: [...by.values()].sort((a, b) => b.last.localeCompare(a.last)) });
});
