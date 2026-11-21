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

// ---------------------------------------------------------------------------------------------------------------------
// E-mail to the vet when a booking arrives (a request to answer, or an appointment already confirmed), and to the owner when a request is declined.

type L7 = Record<Lang, string>;
const V: Record<string, L7> = {
  reqS: { fr: "Nouvelle demande de rendez-vous", it: "Nuova richiesta di appuntamento", en: "New appointment request", es: "Nueva solicitud de cita", pt: "Novo pedido de consulta", de: "Neue Terminanfrage", pl: "Nowa prośba o wizytę" },
  bookedS: { fr: "Nouveau rendez-vous confirmé", it: "Nuovo appuntamento confermato", en: "New appointment booked", es: "Nueva cita confirmada", pt: "Nova consulta confirmada", de: "Neuer Termin bestätigt", pl: "Nowa wizyta potwierdzona" },
  reqI: { fr: "Un client demande un rendez-vous. Acceptez ou refusez la demande depuis votre espace Televet.", it: "Un cliente chiede un appuntamento. Accetta o rifiuta la richiesta dalla tua area Televet.", en: "A client is asking for an appointment. Accept or decline the request in your Televet space.", es: "Un cliente solicita una cita. Acepta o rechaza la solicitud desde tu espacio Televet.", pt: "Um cliente pede uma consulta. Aceite ou recuse o pedido na sua área Televet.", de: "Ein Kunde fragt einen Termin an. Nehmen Sie die Anfrage in Ihrem Televet-Bereich an oder lehnen Sie sie ab.", pl: "Klient prosi o wizytę. Przyjmij lub odrzuć prośbę w swoim koncie Televet." },
  bookedI: { fr: "Un rendez-vous vient d'être réservé et confirmé automatiquement.", it: "Un appuntamento è appena stato prenotato e confermato automaticamente.", en: "An appointment has just been booked and confirmed automatically.", es: "Se acaba de reservar una cita, confirmada automáticamente.", pt: "Uma consulta acabou de ser marcada e confirmada automaticamente.", de: "Ein Termin wurde soeben gebucht und automatisch bestätigt.", pl: "Właśnie zarezerwowano wizytę i potwierdzono ją automatycznie." },
  client: { fr: "Client", it: "Cliente", en: "Client", es: "Cliente", pt: "Cliente", de: "Kunde", pl: "Klient" },
  pet: { fr: "Animal", it: "Animale", en: "Pet", es: "Mascota", pt: "Animal", de: "Tier", pl: "Zwierzę" },
  service: { fr: "Consultation", it: "Visita", en: "Consultation", es: "Consulta", pt: "Consulta", de: "Leistung", pl: "Konsultacja" },
  motive: { fr: "Motif", it: "Motivo", en: "Reason", es: "Motivo", pt: "Motivo", de: "Anlass", pl: "Powód" },
  access: { fr: "Accès", it: "Accesso", en: "Access", es: "Acceso", pt: "Acesso", de: "Zugang", pl: "Dojście" },
  travel: { fr: "Trajet réservé", it: "Tragitto riservato", en: "Travel time kept free", es: "Trayecto reservado", pt: "Trajeto reservado", de: "Fahrzeit reserviert", pl: "Zarezerwowany dojazd" },
  travelV: { fr: "{n} min avant et après", it: "{n} min prima e dopo", en: "{n} min before and after", es: "{n} min antes y después", pt: "{n} min antes e depois", de: "{n} Min. davor und danach", pl: "{n} min przed i po" },
  price: { fr: "Prix", it: "Prezzo", en: "Price", es: "Precio", pt: "Preço", de: "Preis", pl: "Cena" },
  maps: { fr: "Voir l'itinéraire dans Google Maps", it: "Apri l'itinerario in Google Maps", en: "Open directions in Google Maps", es: "Ver la ruta en Google Maps", pt: "Ver o percurso no Google Maps", de: "Route in Google Maps öffnen", pl: "Otwórz trasę w Mapach Google" },
  reqCta: { fr: "Répondre à la demande", it: "Rispondi alla richiesta", en: "Answer the request", es: "Responder a la solicitud", pt: "Responder ao pedido", de: "Anfrage beantworten", pl: "Odpowiedz na prośbę" },
  bookedCta: { fr: "Ouvrir mon agenda", it: "Apri la mia agenda", en: "Open my agenda", es: "Abrir mi agenda", pt: "Abrir a minha agenda", de: "Meinen Kalender öffnen", pl: "Otwórz kalendarz" },
  decS: { fr: "Votre demande de rendez-vous n'a pas pu être acceptée", it: "La tua richiesta di appuntamento non è stata accettata", en: "Your appointment request could not be accepted", es: "Tu solicitud de cita no pudo ser aceptada", pt: "O seu pedido de consulta não pôde ser aceite", de: "Ihre Terminanfrage konnte nicht angenommen werden", pl: "Twoja prośba o wizytę nie została przyjęta" },
  decI: { fr: "{practice} n'a pas pu accepter votre demande pour le {when}.", it: "{practice} non ha potuto accettare la tua richiesta per {when}.", en: "{practice} could not accept your request for {when}.", es: "{practice} no pudo aceptar tu solicitud para el {when}.", pt: "{practice} não pôde aceitar o seu pedido para {when}.", de: "{practice} konnte Ihre Anfrage für {when} nicht annehmen.", pl: "{practice} nie może przyjąć Twojej prośby na {when}." },
  decPay: { fr: "Vous n'êtes pas débité : le montant bloqué sur votre carte est libéré (ou remboursé).", it: "Non ti viene addebitato nulla: l'importo bloccato sulla carta viene liberato (o rimborsato).", en: "You are not charged: the amount held on your card is released (or refunded).", es: "No se te cobra nada: el importe retenido en tu tarjeta se libera (o se reembolsa).", pt: "Não lhe é cobrado nada: o valor retido no cartão é libertado (ou reembolsado).", de: "Ihnen wird nichts berechnet: Der auf Ihrer Karte reservierte Betrag wird freigegeben (oder erstattet).", pl: "Nic nie płacisz: kwota zablokowana na karcie zostaje zwolniona (lub zwrócona)." },
  decReply: { fr: "Message du vétérinaire", it: "Messaggio del veterinario", en: "Message from the vet", es: "Mensaje del veterinario", pt: "Mensagem do veterinário", de: "Nachricht der Tierarztpraxis", pl: "Wiadomość od weterynarza" },
  decCta: { fr: "Choisir un autre horaire", it: "Scegli un altro orario", en: "Choose another time", es: "Elegir otro horario", pt: "Escolher outro horário", de: "Anderen Termin wählen", pl: "Wybierz inny termin" },
};
const langOf = (lang: string): Lang => ((lang in T ? lang : "en") as Lang);
const TYPE_NAMES: Record<string, L7> = {
  home: { fr: "Visite à domicile", it: "Visita a domicilio", en: "Home visit", es: "Visita a domicilio", pt: "Visita ao domicílio", de: "Hausbesuch", pl: "Wizyta domowa" },
  video: { fr: "Téléconsultation", it: "Videoconsulto", en: "Video consultation", es: "Videoconsulta", pt: "Videoconsulta", de: "Videosprechstunde", pl: "Wideokonsultacja" },
  clinic: { fr: "Consultation à la clinique", it: "Visita in clinica", en: "Clinic appointment", es: "Consulta en clínica", pt: "Consulta na clínica", de: "Termin in der Praxis", pl: "Wizyta w klinice" },
  expertise: { fr: "Télé-expertise", it: "Tele-expertise", en: "Tele-expertise", es: "Teleexperticia", pt: "Tele-expertise", de: "Tele-Expertise", pl: "Teleekspertyza" },
};
/** Name of a consultation for an e-mail: the vet's own name for it, else the kind of appointment in the reader's language. */
export const serviceLabel = (customName: string | null | undefined, type: string, lang: string) => customName?.trim() || TYPE_NAMES[type]?.[langOf(lang)] || type;
const BTN = "display:inline-block;background:#053ABE;color:#fff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:10px";

/** Shared look of the newer e-mails: logo, greeting, intro, a table of facts, then free HTML (buttons, notes). */
function frame(hello: string, intro: string, rows: [string, string][], after: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F6F8FB;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #E3E8EF;border-radius:14px" cellpadding="0" cellspacing="0"><tr><td style="padding:24px">
<p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#053ABE">televet</p>
<p style="margin:16px 0 8px;font-size:16px">${esc(hello)}</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5">${esc(intro)}</p>
${rows.length ? `<table role="presentation" width="100%" style="background:#F6F8FB;border-radius:10px" cellpadding="10">${rows.map(([k, v]) => `<tr><td style="font-size:13px;color:#526077;width:110px;vertical-align:top">${esc(k)}</td><td style="font-size:15px;font-weight:bold">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>` : ""}
${after}
</td></tr></table></td></tr></table></body></html>`;
}

export interface VetMailData {
  lang: string; kind: "request" | "booked"; vetName: string; when: string; client: string; phone?: string | null; pet?: string | null;
  service: string; motive?: string | null; price?: string | null;
  /** home visits only */
  address?: string | null; accessNotes?: string | null; mapsUrl?: string | null; travelMin?: number | null;
  dashboardUrl: string;
}

/** To the vet: a new request to accept or decline, or a new appointment confirmed automatically. Home visits carry the address and a directions link. */
export function vetBookingEmail(d: VetMailData) {
  const l = langOf(d.lang), t = T[l], v = (k: string) => V[k][l], request = d.kind === "request";
  const rows: [string, string][] = [
    [t.when, d.when], [v("client"), [d.client, d.phone].filter(Boolean).join(" · ")],
    ...(d.pet ? [[v("pet"), d.pet] as [string, string]] : []), [v("service"), d.service],
    ...(d.motive ? [[v("motive"), d.motive] as [string, string]] : []),
    ...(d.address ? [[t.where, d.address] as [string, string]] : []),
    ...(d.address && d.accessNotes ? [[v("access"), d.accessNotes] as [string, string]] : []),
    ...(d.address && d.travelMin ? [[v("travel"), v("travelV").replace("{n}", String(d.travelMin))] as [string, string]] : []),
    ...(d.price ? [[v("price"), d.price] as [string, string]] : []),
  ];
  const after = `${d.address && d.mapsUrl ? `<p style="margin:18px 0 0"><a href="${esc(d.mapsUrl)}" style="color:#053ABE;font-weight:bold;font-size:15px">${esc(v("maps"))} →</a></p>` : ""}
<p style="margin:22px 0 0"><a href="${esc(d.dashboardUrl)}" style="${BTN}">${esc(v(request ? "reqCta" : "bookedCta"))}</a></p>`;
  return { subject: `${v(request ? "reqS" : "bookedS")} · ${d.when}`, html: frame(`${t.hello} ${d.vetName},`, v(request ? "reqI" : "bookedI"), rows, after) };
}

/** To the owner when the vet declines a request: what happened, the vet's message if any, and a way to pick another time. */
export function declinedEmail(d: { lang: string; name: string; practice: string; when: string; reply?: string | null; paidOnline: boolean; againUrl: string }) {
  const l = langOf(d.lang), t = T[l], v = (k: string) => V[k][l];
  const after = `${d.reply ? `<p style="margin:16px 0 4px;font-size:13px;color:#526077">${esc(v("decReply"))}</p><p style="margin:0;font-size:15px;line-height:1.5">${esc(d.reply).replace(/\n/g, "<br>")}</p>` : ""}
${d.paidOnline ? `<p style="margin:16px 0 0;font-size:14px;color:#344054">${esc(v("decPay"))}</p>` : ""}
<p style="margin:22px 0 0"><a href="${esc(d.againUrl)}" style="${BTN}">${esc(v("decCta"))}</a></p>`;
  return { subject: v("decS"), html: frame(`${t.hello} ${d.name},`, v("decI").replace("{practice}", d.practice).replace("{when}", d.when), [], after) };
}

