import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "./supabase";
import { sendEmail } from "./notify";
import { SITE } from "./seo";
import { COUNTRIES } from "./countries";
import { esc, missingItems, ONBOARDING_COPY as T, REMINDER_DAYS, type Missing } from "./onboarding-copy";

/** Missing steps for every practice (or just one). Volumes are small at this stage, so this reads whole tables. */
export async function checklist(db: SupabaseClient, practiceId?: string): Promise<Map<string, Missing[]>> {
  let pq = db.from("practices").select("id, kind, phone, postal_code, address, stripe_status, mp_status").limit(20000);
  if (practiceId) pq = pq.eq("id", practiceId);
  const [{ data: ps }, { data: vets }, { data: svcs }, { data: rules }] = await Promise.all([
    pq,
    db.from("practitioners").select("id, practice_id").limit(50000),
    db.from("services").select("practice_id, active, price_cents").limit(100000),
    db.from("opening_rules").select("practitioner_id").limit(200000),
  ]);
  const vetPractice = new Map((vets ?? []).map((v) => [v.id, v.practice_id]));
  const sBy = new Map<string, { active: boolean; price_cents: number }[]>(), rBy = new Map<string, number>();
  for (const s of svcs ?? []) sBy.set(s.practice_id, [...(sBy.get(s.practice_id) ?? []), s]);
  for (const r of rules ?? []) { const pid = vetPractice.get(r.practitioner_id); if (pid) rBy.set(pid, (rBy.get(pid) ?? 0) + 1); }
  return new Map((ps ?? []).map((p) => [p.id, missingItems(p, sBy.get(p.id) ?? [], rBy.get(p.id) ?? 0)]));
}

export function onboardingEmail(lang: string, country: string, name: string, missing: Missing[], index: number) {
  const t = (lang === "pt" && country.toUpperCase() === "BR" ? T["pt-BR"] : T[lang]) ?? T.en, l = T[lang] ? lang : "en";
  const url = `${SITE}/${l}/${country.toLowerCase()}/pro/inscription`;
  const html = `<!doctype html><html><body style="margin:0;background:#F6F8FB;font-family:Arial,Helvetica,sans-serif;color:#0F172A"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #E3E8EF;border-radius:14px"><tr><td style="padding:26px">
<p style="margin:0 0 14px;font-size:20px;font-weight:bold;color:#053ABE">televet</p>
<p style="margin:0 0 10px;font-size:16px">${esc(t.hi)}${name ? ` ${esc(name)}` : ""},</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${esc(t.intro)}</p>
<p style="margin:0 0 6px;font-size:15px;font-weight:bold">${esc(t.todo)}</p>
<ul style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.6">${missing.map((m) => `<li>${esc(t.items[m])}</li>`).join("")}</ul>
<p style="margin:0 0 18px"><a href="${url}" style="display:inline-block;background:#053ABE;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(t.cta)}</a></p>
<p style="margin:0 0 10px;font-size:13px;color:#526077">${esc(t.help)}</p>
<p style="margin:0;font-size:12px;color:#8A96A8">${esc(t.stop)}</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: index >= REMINDER_DAYS.length - 1 ? t.last : t.s, html };
}

/** Sends the next reminder for one practice. Marks the counter first so a failure can never cause a double send. */
export async function sendOnboardingReminder(practiceId: string, opts: { force?: boolean } = {}): Promise<"sent" | "complete" | "no_email" | "not_due"> {
  const db = adminClient();
  const { data: p } = await db.from("practices").select("id, name, country, kind, email, languages, created_at, owner_user_id, onboarding_reminders, onboarding_reminded_at").eq("id", practiceId).single();
  if (!p) return "not_due";
  const missing = (await checklist(db, p.id)).get(p.id) ?? [];
  if (!missing.length) return "complete";
  const n = p.onboarding_reminders ?? 0;
  if (!opts.force) {
    const due = new Date(p.created_at).getTime() + (REMINDER_DAYS[n] ?? Infinity) * 86400000;
    const recent = p.onboarding_reminded_at && Date.now() - new Date(p.onboarding_reminded_at).getTime() < 20 * 3600000;
    if (n >= REMINDER_DAYS.length || Date.now() < due || recent) return "not_due";
  }
  const { data: u } = await db.auth.admin.getUserById(p.owner_user_id);
  const to = u.user?.email ?? p.email;
  await db.from("practices").update({ onboarding_reminders: n + 1, onboarding_reminded_at: new Date().toISOString() }).eq("id", p.id);
  if (!to) return "no_email";
  const country = COUNTRIES[p.country] ? p.country : "FR";
  const lang = (p.languages ?? []).find((x: string) => T[x]) ?? COUNTRIES[country].languages[0];
  const name = String(u.user?.user_metadata?.full_name ?? "").split(" ")[0];
  const m = onboardingEmail(lang, country, name, missing, Math.min(n, REMINDER_DAYS.length - 1));
  await sendEmail(to, m.subject, m.html);
  return "sent";
}
export { REMINDER_DAYS, type Missing } from "./onboarding-copy";
