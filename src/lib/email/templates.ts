/** Transactional e-mails (confirmation + reminders), in the 7 platform languages. */
type Lang = "fr" | "it" | "en" | "es" | "pt" | "de" | "pl";
const T: Record<Lang, Record<string, string>> = {
  fr: { confirmS: "Rendez-vous confirmé", remindS: "Rappel : votre rendez-vous", hello: "Bonjour", confirmed: "Votre rendez-vous est confirmé.", remind: "Petit rappel de votre rendez-vous.", when: "Quand", with: "Avec", where: "Adresse", join: "Rejoindre la visio", joinNote: "Le lien est actif 15 minutes avant le rendez-vous. Aucune application à installer.", manage: "Retrouvez ce rendez-vous dans votre espace Televet.", vetRemind: "Rappel : téléconsultation" },
  it: { confirmS: "Appuntamento confermato", remindS: "Promemoria: il tuo appuntamento", hello: "Buongiorno", confirmed: "Il tuo appuntamento è confermato.", remind: "Ti ricordiamo il tuo appuntamento.", when: "Quando", with: "Con", where: "Indirizzo", join: "Entra nel videoconsulto", joinNote: "Il link è attivo 15 minuti prima dell'appuntamento. Nessuna app da installare.", manage: "Trovi questo appuntamento nella tua area Televet.", vetRemind: "Promemoria: teleconsulto" },
  en: { confirmS: "Appointment confirmed", remindS: "Reminder: your appointment", hello: "Hello", confirmed: "Your appointment is confirmed.", remind: "A quick reminder of your appointment.", when: "When", with: "With", where: "Address", join: "Join the video call", joinNote: "The link opens 15 minutes before the appointment. No app to install.", manage: "Find this appointment in your Televet space.", vetRemind: "Reminder: video consultation" },
  es: { confirmS: "Turno confirmado", remindS: "Recordatorio: tu turno", hello: "Hola", confirmed: "Tu turno está confirmado.", remind: "Te recordamos tu turno.", when: "Cuándo", with: "Con", where: "Dirección", join: "Entrar a la videollamada", joinNote: "El enlace se activa 15 minutos antes del turno. No hace falta instalar nada.", manage: "Encuentra este turno en tu espacio Televet.", vetRemind: "Recordatorio: teleconsulta" },
  pt: { confirmS: "Consulta confirmada", remindS: "Lembrete: a sua consulta", hello: "Olá", confirmed: "A sua consulta está confirmada.", remind: "Lembramos a sua consulta.", when: "Quando", with: "Com", where: "Morada", join: "Entrar na videochamada", joinNote: "O link fica ativo 15 minutos antes da consulta. Não é preciso instalar nada.", manage: "Encontre esta consulta na sua área Televet.", vetRemind: "Lembrete: teleconsulta" },
  de: { confirmS: "Termin bestätigt", remindS: "Erinnerung: Ihr Termin", hello: "Hallo", confirmed: "Ihr Termin ist bestätigt.", remind: "Eine kurze Erinnerung an Ihren Termin.", when: "Wann", with: "Mit", where: "Adresse", join: "Videosprechstunde beitreten", joinNote: "Der Link ist 15 Minuten vor dem Termin aktiv. Keine App nötig.", manage: "Sie finden den Termin in Ihrem Televet-Bereich.", vetRemind: "Erinnerung: Videosprechstunde" },
  pl: { confirmS: "Wizyta potwierdzona", remindS: "Przypomnienie: Twoja wizyta", hello: "Dzień dobry", confirmed: "Twoja wizyta jest potwierdzona.", remind: "Przypominamy o Twojej wizycie.", when: "Kiedy", with: "Z", where: "Adres", join: "Dołącz do wideokonsultacji", joinNote: "Link działa od 15 minut przed wizytą. Bez instalowania aplikacji.", manage: "Wizytę znajdziesz w swoim koncie Televet.", vetRemind: "Przypomnienie: wideokonsultacja" },
};

export interface MailData {
  lang: string; name: string; when: string; withName: string; service: string;
  address?: string | null; joinUrl?: string | null; note?: string | null; appUrl: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function layout(t: Record<string, string>, intro: string, d: MailData) {
  const rows = [[t.when, d.when], [t.with, `${d.withName} · ${d.service}`], ...(d.address ? [[t.where, d.address]] : [])];
  return `<!doctype html><html><body style="margin:0;background:#F6F8FB;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #E3E8EF;border-radius:14px" cellpadding="0" cellspacing="0"><tr><td style="padding:24px">
<p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#053ABE">televet</p>
<p style="margin:16px 0 8px;font-size:16px">${esc(t.hello)} ${esc(d.name)},</p>
<p style="margin:0 0 16px;font-size:16px">${esc(intro)}</p>
<table role="presentation" width="100%" style="background:#F6F8FB;border-radius:10px" cellpadding="10">${rows.map(([k, v]) => `<tr><td style="font-size:13px;color:#526077;width:90px">${esc(k)}</td><td style="font-size:15px;font-weight:bold">${esc(v)}</td></tr>`).join("")}</table>
${d.note ? `<p style="margin:16px 0 0;font-size:14px;color:#344054">${esc(d.note)}</p>` : ""}
${d.joinUrl ? `<p style="margin:22px 0 8px"><a href="${esc(d.joinUrl)}" style="display:inline-block;background:#053ABE;color:#fff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:10px">${esc(t.join)}</a></p><p style="margin:0;font-size:13px;color:#526077">${esc(t.joinNote)}</p>` : ""}
<p style="margin:22px 0 0;font-size:13px;color:#526077">${esc(t.manage)} <a href="${esc(d.appUrl)}" style="color:#053ABE">${esc(d.appUrl.replace(/^https?:\/\//, ""))}</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

const pick = (lang: string) => T[(lang in T ? lang : "en") as Lang];

const REP: Record<Lang, { s: string; i: string; k: string[] }> = {
  fr: { s: "Compte rendu de votre consultation", i: "Votre vétérinaire a validé le compte rendu de votre consultation.", k: ["Motif", "Observations", "Conseils", "Suivi", "Consulter en urgence si"] },
  it: { s: "Referto della tua visita", i: "Il tuo veterinario ha convalidato il referto della visita.", k: ["Motivo", "Osservazioni", "Consigli", "Follow-up", "Consultare d'urgenza se"] },
  en: { s: "Your consultation report", i: "Your vet has validated the report of your consultation.", k: ["Reason", "Observations", "Advice", "Follow-up", "Seek urgent care if"] },
  es: { s: "Informe de tu consulta", i: "Tu veterinario validó el informe de tu consulta.", k: ["Motivo", "Observaciones", "Consejos", "Seguimiento", "Consultar de urgencia si"] },
  pt: { s: "Relatório da sua consulta", i: "O seu veterinário validou o relatório da consulta.", k: ["Motivo", "Observações", "Conselhos", "Acompanhamento", "Procurar urgência se"] },
  de: { s: "Bericht Ihrer Konsultation", i: "Ihr Tierarzt hat den Bericht Ihrer Konsultation freigegeben.", k: ["Anlass", "Beobachtungen", "Empfehlungen", "Weiteres Vorgehen", "Sofort Tierarzt aufsuchen bei"] },
  pl: { s: "Raport z Twojej wizyty", i: "Twój weterynarz zatwierdził raport z wizyty.", k: ["Powód", "Obserwacje", "Zalecenia", "Dalsze kroki", "Pilnie do weterynarza, jeśli"] },
};

export function reportEmail(d: MailData, fields: { reason: string; observations: string; advice: string; follow_up: string; warning_signs: string }) {
  const t = pick(d.lang), r = REP[(d.lang in REP ? d.lang : "en") as Lang];
  const vals = [fields.reason, fields.observations, fields.advice, fields.follow_up, fields.warning_signs];
  const note = r.k.map((k, i) => (vals[i] ? `${k} : ${vals[i]}` : "")).filter(Boolean).join("\n\n");
  const html = layout(t, r.i, { ...d, note: null, joinUrl: null }).replace("</td></tr></table></td></tr></table>",
    `${r.k.map((k, i) => vals[i] ? `<p style="margin:16px 0 4px;font-size:12px;font-weight:bold;color:#526077;text-transform:uppercase">${esc(k)}</p><p style="margin:0;font-size:15px;line-height:1.55">${esc(vals[i]).replace(/\n/g, "<br>")}</p>` : "").join("")}</td></tr></table></td></tr></table>`);
  return { subject: `${r.s} · ${d.when}`, html, text: note };
}

export function confirmationEmail(d: MailData) {
  const t = pick(d.lang);
  return { subject: `${t.confirmS} · ${d.when}`, html: layout(t, t.confirmed, d) };
}

export function reminderEmail(d: MailData, forVet = false) {
  const t = pick(d.lang);
  return { subject: `${forVet ? t.vetRemind : t.remindS} · ${d.when}`, html: layout(t, t.remind, d) };
}
