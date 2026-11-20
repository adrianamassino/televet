/** Texts of the push notifications sent to the mobile apps. Pure (no server imports) so it can be unit-tested. */
export type PushKind =
  | "vet_request" | "vet_booked" | "vet_cancelled" | "vet_video_soon"
  | "owner_confirmed" | "owner_declined" | "owner_reminder_24h" | "owner_reminder_2h" | "owner_pet_due";
export type PushVars = { who?: string; when?: string; practice?: string; pet?: string; item?: string; more?: number };

const LANGS = ["fr", "it", "en", "es"] as const;
type Entry = { title: [string, string, string, string]; body: [string, string, string, string] };
const T: Record<PushKind, Entry> = {
  vet_request: { title: ["Nouvelle demande de rendez-vous", "Nuova richiesta di appuntamento", "New appointment request", "Nueva solicitud de cita"], body: ["{who} · {when}", "{who} · {when}", "{who} · {when}", "{who} · {when}"] },
  vet_booked: { title: ["Nouveau rendez-vous confirmé", "Nuovo appuntamento confermato", "New appointment booked", "Nueva cita confirmada"], body: ["{who} · {when}", "{who} · {when}", "{who} · {when}", "{who} · {when}"] },
  vet_cancelled: { title: ["Demande annulée par le client", "Richiesta annullata dal cliente", "Request cancelled by the client", "Solicitud cancelada por el cliente"], body: ["{who} · {when}", "{who} · {when}", "{who} · {when}", "{who} · {when}"] },
  vet_video_soon: { title: ["Téléconsultation dans 2 heures", "Videoconsulto tra 2 ore", "Video consultation in 2 hours", "Videoconsulta en 2 horas"], body: ["{who} · {when}", "{who} · {when}", "{who} · {when}", "{who} · {when}"] },
  owner_confirmed: { title: ["Rendez-vous confirmé", "Appuntamento confermato", "Appointment confirmed", "Cita confirmada"], body: ["{practice} · {when}", "{practice} · {when}", "{practice} · {when}", "{practice} · {when}"] },
  owner_declined: { title: ["Rendez-vous refusé", "Appuntamento rifiutato", "Appointment declined", "Cita rechazada"], body: ["{practice} n'a pas pu accepter votre demande. Vous ne payez rien.", "{practice} non ha potuto accettare la richiesta. Non paghi nulla.", "{practice} couldn't accept your request. You pay nothing.", "{practice} no pudo aceptar tu solicitud. No pagas nada."] },
  owner_reminder_24h: { title: ["Rappel de rendez-vous", "Promemoria appuntamento", "Appointment reminder", "Recordatorio de cita"], body: ["{practice} · {when}", "{practice} · {when}", "{practice} · {when}", "{practice} · {when}"] },
  owner_reminder_2h: { title: ["Votre rendez-vous approche", "Il tuo appuntamento è tra poco", "Your appointment is coming up", "Tu cita es pronto"], body: ["{practice} · {when}", "{practice} · {when}", "{practice} · {when}", "{practice} · {when}"] },
  owner_pet_due: { title: ["Rappel santé : {pet}", "Promemoria salute: {pet}", "Health reminder: {pet}", "Recordatorio de salud: {pet}"], body: ["{item} · {when}", "{item} · {when}", "{item} · {when}", "{item} · {when}"] },
};
const MORE = ["+{n} autres", "+{n} altri", "+{n} more", "+{n} más"];

export const pushLang = (lang: string | null | undefined) => { const i = LANGS.indexOf((lang ?? "").slice(0, 2).toLowerCase() as (typeof LANGS)[number]); return i < 0 ? 2 : i; };

/** Fills a template; a missing value removes its placeholder and any " · " separator left dangling. */
function fill(tpl: string, v: PushVars): string {
  const s = tpl.replace(/\{(\w+)\}/g, (_, k: string) => String((v as Record<string, unknown>)[k] ?? ""));
  return s.replace(/^\s*[·:]\s*|\s*[·:]\s*$/g, "").replace(/\s+·\s+·\s+/g, " · ").replace(/\s{2,}/g, " ").trim();
}

export function pushText(kind: PushKind, lang: string | null | undefined, v: PushVars = {}): { title: string; body: string } {
  const i = pushLang(lang), e = T[kind];
  let body = fill(e.body[i], v);
  if (v.more && v.more > 0) body += ` (${MORE[i].replace("{n}", String(v.more))})`;
  return { title: fill(e.title[i], v).slice(0, 110), body: body.slice(0, 178) };
}

/** Expo push tokens look like ExponentPushToken[xxxxxxxx] (or ExpoPushToken[…]). */
export const isExpoToken = (t: unknown): t is string => typeof t === "string" && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,100}\]$/.test(t);
