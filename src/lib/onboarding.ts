import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "./supabase";
import { sendEmail } from "./notify";
import { SITE } from "./seo";
import { COUNTRIES } from "./countries";
import { brazilian } from "./brazilian";

/** What a vet still has to set up before the profile can take bookings. */
export type Missing = "profile" | "services" | "hours" | "payments";
type P = { kind: string; phone: string | null; postal_code: string | null; address: string | null; stripe_status: string; mp_status: string };

/** Pure check: which setup steps are missing for one practice. */
export function missingItems(p: P, services: { active: boolean; price_cents: number }[], openingRules: number): Missing[] {
  const out: Missing[] = [];
  if (!p.phone?.trim() || !p.postal_code?.trim() || (p.kind === "clinic" && !p.address?.trim())) out.push("profile");
  if (!services.some((s) => s.active && s.price_cents > 0)) out.push("services");
  if (openingRules < 1) out.push("hours");
  if (p.stripe_status !== "active" && p.mp_status !== "active") out.push("payments");
  return out;
}

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

type L = { s: string; last: string; hi: string; intro: string; todo: string; items: Record<Missing, string>; cta: string; help: string; stop: string };
const T: Record<string, L> = {
  fr: { s: "Terminez votre profil Televet", last: "Dernier rappel : terminez votre profil Televet", hi: "Bonjour", intro: "Votre compte Televet est créé, mais votre profil n'est pas encore complet : vos clients ne peuvent pas encore réserver avec vous.", todo: "Il reste à faire :",
    items: { profile: "Compléter vos coordonnées (téléphone, code postal, adresse)", services: "Ajouter au moins une consultation avec son prix", hours: "Indiquer vos horaires d'ouverture", payments: "Connecter votre compte de paiement pour être payé" }, cta: "Terminer mon profil", help: "Cela prend quelques minutes. Une question ? Répondez simplement à cet e-mail.", stop: "Vous recevez cet e-mail parce que vous avez créé un compte sur Televet." },
  it: { s: "Completa il tuo profilo Televet", last: "Ultimo promemoria: completa il tuo profilo Televet", hi: "Buongiorno", intro: "Il tuo account Televet è stato creato, ma il profilo non è ancora completo: i tuoi clienti non possono ancora prenotare con te.", todo: "Resta da fare:",
    items: { profile: "Completare i tuoi dati (telefono, CAP, indirizzo)", services: "Aggiungere almeno una visita con il suo prezzo", hours: "Indicare i tuoi orari di apertura", payments: "Collegare il conto per i pagamenti, così puoi essere pagato" }, cta: "Completa il mio profilo", help: "Bastano pochi minuti. Hai una domanda? Rispondi semplicemente a questa e-mail.", stop: "Ricevi questa e-mail perché hai creato un account su Televet." },
  en: { s: "Finish setting up your Televet profile", last: "Last reminder: finish setting up your Televet profile", hi: "Hello", intro: "Your Televet account is created, but your profile isn't complete yet, so clients can't book with you.", todo: "Still to do:",
    items: { profile: "Complete your details (phone, postal code, address)", services: "Add at least one consultation with its price", hours: "Set your opening hours", payments: "Connect your payment account so you get paid" }, cta: "Finish my profile", help: "It only takes a few minutes. Questions? Just reply to this e-mail.", stop: "You receive this e-mail because you created an account on Televet." },
  es: { s: "Termina tu perfil de Televet", last: "Último recordatorio: termina tu perfil de Televet", hi: "Hola", intro: "Tu cuenta de Televet está creada, pero tu perfil aún no está completo: tus clientes todavía no pueden reservar contigo.", todo: "Falta por hacer:",
    items: { profile: "Completar tus datos (teléfono, código postal, dirección)", services: "Añadir al menos una consulta con su precio", hours: "Indicar tus horarios de atención", payments: "Conectar tu cuenta de pagos para cobrar" }, cta: "Terminar mi perfil", help: "Solo lleva unos minutos. ¿Dudas? Responde a este e-mail.", stop: "Recibes este e-mail porque creaste una cuenta en Televet." },
  pt: { s: "Conclua o seu perfil na Televet", last: "Último lembrete: conclua o seu perfil na Televet", hi: "Olá", intro: "A sua conta Televet foi criada, mas o perfil ainda não está completo: os seus clientes ainda não podem marcar consigo.", todo: "Falta fazer:",
    items: { profile: "Completar os seus dados (telefone, código postal, morada)", services: "Adicionar pelo menos uma consulta com o seu preço", hours: "Indicar o seu horário de atendimento", payments: "Ligar a sua conta de pagamentos para receber" }, cta: "Concluir o meu perfil", help: "Demora apenas alguns minutos. Dúvidas? Responda a este e-mail.", stop: "Recebe este e-mail porque criou uma conta na Televet." },
  de: { s: "Schließen Sie Ihr Televet-Profil ab", last: "Letzte Erinnerung: Schließen Sie Ihr Televet-Profil ab", hi: "Hallo", intro: "Ihr Televet-Konto ist angelegt, aber Ihr Profil ist noch nicht vollständig: Kunden können noch nicht bei Ihnen buchen.", todo: "Noch zu erledigen:",
    items: { profile: "Angaben vervollständigen (Telefon, Postleitzahl, Adresse)", services: "Mindestens eine Konsultation mit Preis hinzufügen", hours: "Öffnungszeiten angeben", payments: "Zahlungskonto verbinden, um Geld zu erhalten" }, cta: "Profil abschließen", help: "Es dauert nur wenige Minuten. Fragen? Antworten Sie einfach auf diese E-Mail.", stop: "Sie erhalten diese E-Mail, weil Sie ein Konto bei Televet erstellt haben." },
  pl: { s: "Dokończ swój profil w Televet", last: "Ostatnie przypomnienie: dokończ swój profil w Televet", hi: "Dzień dobry", intro: "Twoje konto w Televet zostało utworzone, ale profil nie jest jeszcze kompletny: klienci nie mogą jeszcze umawiać się z Tobą.", todo: "Do zrobienia:",
    items: { profile: "Uzupełnij dane (telefon, kod pocztowy, adres)", services: "Dodaj co najmniej jedną konsultację z ceną", hours: "Podaj godziny pracy", payments: "Połącz konto płatnicze, aby otrzymywać wypłaty" }, cta: "Dokończ profil", help: "To zajmie kilka minut. Pytania? Odpowiedz na tego e-maila.", stop: "Otrzymujesz tę wiadomość, ponieważ założyłeś konto w Televet." },
  nl: { s: "Rond uw Televet-profiel af", last: "Laatste herinnering: rond uw Televet-profiel af", hi: "Hallo", intro: "Uw Televet-account is aangemaakt, maar uw profiel is nog niet compleet: klanten kunnen nog niet bij u boeken.", todo: "Nog te doen:",
    items: { profile: "Gegevens aanvullen (telefoon, postcode, adres)", services: "Minstens één consult met prijs toevoegen", hours: "Openingstijden invullen", payments: "Uw betaalaccount koppelen om betaald te worden" }, cta: "Mijn profiel afronden", help: "Het kost maar enkele minuten. Vragen? Beantwoord gewoon deze e-mail.", stop: "U ontvangt deze e-mail omdat u een account bij Televet hebt aangemaakt." },
};
T["pt-BR"] = brazilian(T.pt);
export const ONBOARDING_COPY = T;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
/** Days after sign-up at which reminder 1, 2, 3, 4 and 5 are sent. */
export const REMINDER_DAYS = [1, 3, 7, 14, 30];

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
