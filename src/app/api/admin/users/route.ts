import { adminClient, handle, json } from "@/lib/supabase";
import { requireStaff } from "@/lib/admin";

/** GET /api/admin/users?q=&role=owner|pro — everyone who signed up, with their role and pets. */
export const GET = handle(async (req) => {
  await requireStaff(req);
  const u = new URL(req.url), db = adminClient();
  const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string; app_metadata?: { provider?: string } }[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    users.push(...(data.users as typeof users));
    if (data.users.length < 200) break;
  }
  const [{ data: owners }, { data: pets }, { data: practices }, { data: bk }] = await Promise.all([
    db.from("owners").select("id, full_name, phone, country, language"),
    db.from("pets").select("id, owner_id, name, species"),
    db.from("practices").select("id, owner_user_id, name, kind, review_status, country"),
    db.from("bookings").select("owner_id").limit(50000),
  ]);
  const om = new Map((owners ?? []).map((o) => [o.id, o])), pm = new Map<string, string[]>(), prm = new Map<string, { id: string; name: string; kind: string; review_status: string; country: string }[]>(), bc = new Map<string, number>();
  for (const p of pets ?? []) pm.set(p.owner_id, [...(pm.get(p.owner_id) ?? []), `${p.name} (${p.species})`]);
  for (const p of practices ?? []) prm.set(p.owner_user_id, [...(prm.get(p.owner_user_id) ?? []), p]);
  for (const b of bk ?? []) bc.set(b.owner_id, (bc.get(b.owner_id) ?? 0) + 1);
  const text = (u.searchParams.get("q") ?? "").trim().toLowerCase(), role = u.searchParams.get("role"), country = u.searchParams.get("country");
  const items = users.map((x) => { const o = om.get(x.id), pr = prm.get(x.id) ?? []; return { id: x.id, email: x.email ?? "", provider: x.app_metadata?.provider ?? "email", created_at: x.created_at, last_sign_in_at: x.last_sign_in_at ?? null, name: o?.full_name ?? "", phone: o?.phone ?? "", country: o?.country ?? pr[0]?.country ?? "", roles: [...(o ? ["owner"] : []), ...(pr.length ? ["pro"] : [])], pets: pm.get(x.id) ?? [], practices: pr, bookings: bc.get(x.id) ?? 0 }; })
    .filter((x) => (!role || x.roles.includes(role)) && (!country || x.country === country) && (!text || `${x.email} ${x.name} ${x.pets.join(" ")} ${x.practices.map((p) => p.name).join(" ")}`.toLowerCase().includes(text)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return json({ items, total: items.length });
});
