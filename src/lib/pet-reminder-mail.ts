import { adminClient } from "./supabase";
import { sendEmail } from "./notify";
import { SITE } from "./seo";
import { COUNTRIES } from "./countries";
import { reminderStage, daysUntil, type Stage } from "./pet-health";
import { pushPetDue } from "./push";

type L = { s: string; hi: string; intro: string; d30: string; d7: string; d0: string; late: string; cta: string; note: string; kinds: Record<string, string> };
const T: Record<string, L> = {
  fr: { s: "Rappel santé pour votre animal", hi: "Bonjour", intro: "D'après le carnet de santé enregistré dans votre espace Televet :", d30: "dans {n} jours", d7: "dans {n} jours", d0: "aujourd'hui", late: "il y a {n} jours", cta: "Voir le carnet et prendre rendez-vous", note: "Ces rappels sont indicatifs, d'après les dates saisies : demandez conseil à votre vétérinaire.", kinds: { vaccine: "Vaccin", antiparasitic: "Antiparasitaire", treatment: "Traitement", surgery: "Intervention", visit: "Visite", test: "Examen", other: "Soin" } },
  it: { s: "Promemoria salute per il tuo animale", hi: "Buongiorno", intro: "In base al libretto sanitario salvato nel tuo spazio Televet:", d30: "tra {n} giorni", d7: "tra {n} giorni", d0: "oggi", late: "{n} giorni fa", cta: "Vedi il libretto e prenota una visita", note: "I promemoria sono indicativi, in base alle date inserite: chiedi consiglio al tuo veterinario.", kinds: { vaccine: "Vaccino", antiparasitic: "Antiparassitario", treatment: "Trattamento", surgery: "Intervento", visit: "Visita", test: "Esame", other: "Cura" } },
  en: { s: "Health reminder for your pet", hi: "Hello", intro: "According to the health record saved in your Televet account:", d30: "in {n} days", d7: "in {n} days", d0: "today", late: "{n} days ago", cta: "View the record and book a visit", note: "These reminders are indicative, based on the dates entered: ask your vet for advice.", kinds: { vaccine: "Vaccine", antiparasitic: "Parasite treatment", treatment: "Treatment", surgery: "Procedure", visit: "Visit", test: "Test", other: "Care" } },
  es: { s: "Recordatorio de salud para tu mascota", hi: "Hola", intro: "Según la cartilla sanitaria guardada en tu espacio Televet:", d30: "en {n} días", d7: "en {n} días", d0: "hoy", late: "hace {n} días", cta: "Ver la cartilla y pedir cita", note: "Estos recordatorios son orientativos, según las fechas introducidas: consulta a tu veterinario.", kinds: { vaccine: "Vacuna", antiparasitic: "Antiparasitario", treatment: "Tratamiento", surgery: "Intervención", visit: "Visita", test: "Examen", other: "Cuidado" } },
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export type Item = { pet: string; petId: string; kind: string; name: string; due: string; days: number };

export function petReminderEmail(lang: string, country: string, name: string, items: Item[]) {
  const t = T[lang] ?? T.en, l = T[lang] ? lang : "en", url = `${SITE}/${l}/${country.toLowerCase()}/compte`;
  const when = (d: number) => (d === 0 ? t.d0 : d < 0 ? t.late.replace("{n}", String(-d)) : (d <= 7 ? t.d7 : t.d30).replace("{n}", String(d)));
  const fmt = (iso: string) => new Intl.DateTimeFormat(l, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
  const html = `<!doctype html><html><body style="margin:0;background:#F6F8FB;font-family:Arial,Helvetica,sans-serif;color:#0F172A"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #E3E8EF;border-radius:14px"><tr><td style="padding:26px">
<p style="margin:0 0 14px;font-size:20px;font-weight:bold;color:#053ABE">televet</p>
<p style="margin:0 0 10px;font-size:16px">${esc(t.hi)}${name ? ` ${esc(name)}` : ""},</p>
<p style="margin:0 0 12px;font-size:15px">${esc(t.intro)}</p>
<ul style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.7">${items.map((i) => `<li><strong>${esc(i.pet)}</strong> — ${esc(t.kinds[i.kind] ?? i.kind)}: ${esc(i.name)} · ${esc(fmt(i.due))} (${esc(when(i.days))})</li>`).join("")}</ul>
<p style="margin:0 0 18px"><a href="${url}" style="display:inline-block;background:#053ABE;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(t.cta)}</a></p>
<p style="margin:0;font-size:12px;color:#8A96A8">${esc(t.note)}</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: t.s, html };
}

/** Sends the due vaccine / treatment reminders (30 days, 7 days, on the day), one e-mail per owner, each reminder only once. */
export async function sendPetReminders(now = new Date()): Promise<{ owners: number; items: number }> {
  const db = adminClient(), today = now.toISOString().slice(0, 10);
  const lo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10), hi = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const { data } = await db.from("pet_health_records").select("id, owner_id, pet_id, kind, name, next_due, remind_30_at, remind_7_at, remind_0_at, pets(name)").gte("next_due", lo).lte("next_due", hi).limit(2000);
  const byOwner = new Map<string, { ids: { id: string; stage: Stage }[]; items: Item[] }>();
  for (const r of (data ?? []) as unknown as { id: string; owner_id: string; pet_id: string; kind: string; name: string; next_due: string; remind_30_at: string | null; remind_7_at: string | null; remind_0_at: string | null; pets: { name: string } | null }[]) {
    const stage = reminderStage(r.next_due, today, { r30: !!r.remind_30_at, r7: !!r.remind_7_at, r0: !!r.remind_0_at });
    if (!stage) continue;
    const g = byOwner.get(r.owner_id) ?? byOwner.set(r.owner_id, { ids: [], items: [] }).get(r.owner_id)!;
    g.ids.push({ id: r.id, stage }); g.items.push({ pet: r.pets?.name ?? "", petId: r.pet_id, kind: r.kind, name: r.name, due: r.next_due, days: daysUntil(r.next_due, today) });
  }
  let n = 0;
  for (const [ownerId, g] of byOwner) {
    // mark first: a failed send must never cause a second e-mail tomorrow
    const stamp = now.toISOString();
    for (const x of g.ids) await db.from("pet_health_records").update({ [`remind_${x.stage}_at`]: stamp }).eq("id", x.id);
    const [{ data: u }, { data: o }] = await Promise.all([db.auth.admin.getUserById(ownerId), db.from("owners").select("full_name, language, country").eq("id", ownerId).maybeSingle()]);
    await pushPetDue(ownerId, [...g.items].sort((a, b) => a.due.localeCompare(b.due))); // phone notification for people who use the app
    const to = u.user?.email; if (!to) continue;
    const country = o?.country && COUNTRIES[o.country] ? o.country : "FR";
    const m = petReminderEmail(o?.language ?? COUNTRIES[country].languages[0], country, (o?.full_name ?? "").split(" ")[0], g.items.sort((a, b) => a.due.localeCompare(b.due)));
    try { await sendEmail(to, m.subject, m.html); n += g.items.length; } catch (e) { console.error("pet reminder", ownerId, e); }
  }
  return { owners: byOwner.size, items: n };
}
