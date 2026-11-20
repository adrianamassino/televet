/**
 * Imports clinics and vets from the old Televet (app.televet.co) into the new platform, already approved and published.
 *
 * Input: JSON array exported from the old database (any extra field is ignored):
 * [{
 *   "legacy_id": "123", "kind": "clinic|vet|home", "name": "Clinique des Lilas", "owner_email": "lilas@example.fr",
 *   "country": "FR", "city": "Paris", "address": "12 rue des Lilas", "postal_code": "75020", "phone": "…", "email": "…",
 *   "timezone": "Europe/Paris",                       // optional (defaults to the country's)
 *   "commission_pct": 12,                              // optional: clinic-wide commission
 *   "stripe_account_id": "acct_…",                     // optional: reused as is IF the old app used the same Stripe platform account
 *   "practitioners": [{ "display_name": "Marie Durand", "email": "marie@…", "commission_pct": 8 }],
 *   "services": [{ "type": "home|video|clinic", "duration_min": 30, "price_cents": 8000 }],   // optional
 *   "opening": [{ "weekday": 1, "start": "09:00", "end": "18:00" }]                              // optional (0=Sunday… 6)
 * }]
 *
 * Usage:  npx tsx scripts/import-legacy-practices.ts legacy-practices.json            (dry run: validates and prints the plan)
 *         npx tsx scripts/import-legacy-practices.ts legacy-practices.json --apply    (writes)
 * Safe to re-run: a practice whose legacy slug/name already exists for the same owner is skipped.
 * Owners get an account without a password: they sign in with Google or use "forgot password" (no hash can be migrated).
 */
import { readFileSync } from "fs";
import { adminClient } from "../src/lib/supabase";
import { COUNTRIES } from "../src/lib/countries";
import { slugify } from "../src/lib/seo";

interface L {
  legacy_id?: string; kind: "clinic" | "vet" | "home"; name: string; owner_email: string; country: string; city?: string; address?: string; postal_code?: string;
  phone?: string; email?: string; timezone?: string; commission_pct?: number | null; stripe_account_id?: string;
  practitioners?: { display_name: string; email?: string; commission_pct?: number | null }[];
  services?: { type: "home" | "video" | "clinic"; duration_min: number; price_cents: number }[];
  opening?: { weekday: number; start: string; end: string }[];
}
const CATALOG = { video: "video_consult", home: "home_visit", clinic: "clinic_visit" } as const;

export function validate(r: L): string[] {
  const e: string[] = [];
  if (!r.name?.trim()) e.push("name missing");
  if (!["clinic", "vet", "home"].includes(r.kind)) e.push(`kind '${r.kind}' invalid`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.owner_email ?? "")) e.push("owner_email invalid");
  if (!COUNTRIES[(r.country ?? "").toUpperCase()]) e.push(`country '${r.country}' not supported`);
  if (r.commission_pct != null && (r.commission_pct < 0 || r.commission_pct > 100)) e.push("commission_pct out of range");
  if (r.stripe_account_id && !/^acct_\w+$/.test(r.stripe_account_id)) e.push("stripe_account_id invalid");
  for (const s of r.services ?? []) if (!CATALOG[s.type] || s.duration_min < 5 || s.duration_min > 240 || s.price_cents < 0) e.push(`service ${JSON.stringify(s)} invalid`);
  return e;
}

async function main() {
  const file = process.argv[2], apply = process.argv.includes("--apply");
  if (!file) throw new Error("usage: import-legacy-practices.ts <export.json> [--apply]");
  const rows = JSON.parse(readFileSync(file, "utf8")) as L[];
  const report = { total: rows.length, created: 0, skipped: [] as string[], invalid: [] as string[], stripe: { linked: 0, failed: [] as string[] } };
  const db = apply ? adminClient() : null;
  const users = new Map<string, string>();
  if (db) for (let page = 1; ; page++) { const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 }); for (const u of data.users) if (u.email) users.set(u.email.toLowerCase(), u.id); if (data.users.length < 1000) break; }
  const stripeMod = apply && process.env.STRIPE_SECRET_KEY ? await import("../src/lib/payments/stripe") : null;

  for (const r of rows) {
    const label = `${r.legacy_id ?? "?"}:${r.name}`, errs = validate(r);
    if (errs.length) { report.invalid.push(`${label} → ${errs.join("; ")}`); continue; }
    if (!db) { report.created++; continue; }
    const cc = r.country.toUpperCase(), email = r.owner_email.toLowerCase();
    let uid = users.get(email);
    if (!uid) { const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true }); if (error || !data.user) { report.skipped.push(`${label}: ${error?.message}`); continue; } uid = data.user.id; users.set(email, uid); }
    const { data: dup } = await db.from("practices").select("id").eq("owner_user_id", uid).eq("name", r.name).maybeSingle();
    if (dup) { report.skipped.push(`${label}: already imported`); continue; }

    let stripe: { id: string; status: string } | null = null;
    if (r.stripe_account_id) {
      if (!stripeMod) report.stripe.failed.push(`${label}: STRIPE_SECRET_KEY not set`);
      else try { const a = await stripeMod.stripe().accounts.retrieve(r.stripe_account_id); stripe = { id: a.id, status: stripeMod.statusFromAccount(a) }; report.stripe.linked++; }
      catch (e) { report.stripe.failed.push(`${label}: ${(e as Error).message} (different Stripe platform? the vet will have to onboard again)`); }
    }
    const { data: p, error } = await db.from("practices").insert({
      owner_user_id: uid, country: cc, kind: r.kind, name: r.name.trim(), slug: `${slugify(r.name) || "vet"}-${Math.random().toString(36).slice(2, 6)}`,
      address: [r.address, r.city].filter(Boolean).join(", ") || null, postal_code: r.postal_code ?? null, phone: r.phone ?? null, email: r.email ?? r.owner_email,
      timezone: r.timezone ?? COUNTRIES[cc].timezone, commission_pct: r.commission_pct ?? null, published: true, review_status: "approved", reviewed_by: "legacy-import", reviewed_at: new Date().toISOString(),
      stripe_account_id: stripe?.id ?? null, stripe_status: stripe?.status ?? "none",
    }).select("id").single();
    if (error || !p) { report.skipped.push(`${label}: ${error?.message}`); continue; }
    const vets = r.practitioners?.length ? r.practitioners : [{ display_name: r.name }];
    for (const v of vets) {
      let vu: string | null = null;
      if (v.email) { const k = v.email.toLowerCase(); vu = users.get(k) ?? null; if (!vu) { const { data } = await db.auth.admin.createUser({ email: k, email_confirm: true }); vu = data.user?.id ?? null; if (vu) users.set(k, vu); } }
      const { data: pr } = await db.from("practitioners").insert({ practice_id: p.id, user_id: vu ?? (vets.length === 1 ? uid : null), display_name: v.display_name, commission_pct: v.commission_pct ?? null, approved: true, approved_at: new Date().toISOString() }).select("id").single();
      if (!pr) continue;
      if (r.services?.length) await db.from("services").insert(r.services.map((s) => ({ practice_id: p.id, practitioner_id: pr.id, type: s.type, catalog_code: CATALOG[s.type], duration_min: s.duration_min, price_cents: s.price_cents, currency: COUNTRIES[cc].currency })));
      if (r.opening?.length) await db.from("opening_rules").insert(r.opening.map((o) => ({ practitioner_id: pr.id, weekday: o.weekday, start_time: o.start, end_time: o.end, slot_min: 30 })));
    }
    report.created++;
  }
  console.log(apply ? "APPLIED" : "DRY RUN (nothing written; add --apply)"); console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1]?.includes("import-legacy-practices")) main().catch((e) => { console.error(e); process.exit(1); });
