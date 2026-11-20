import { adminClient } from "./supabase";
import { sendEmail } from "./notify";
import { SITE } from "./seo";

type L = { s: string; hi: string; q: string; sub: string; foot: string; stars: string };
const T: Record<string, L> = {
  fr: { s: "Comment s'est passé votre rendez-vous Televet ?", hi: "Bonjour", q: "Comment évaluez-vous votre expérience avec Televet ?", sub: "Un clic suffit : 1 étoile = très déçu, 5 étoiles = parfait. Cela nous aide à nous améliorer.", foot: "Merci d'avoir fait confiance à Televet pour votre compagnon.", stars: "étoiles" },
  it: { s: "Com'è andato il tuo appuntamento con Televet?", hi: "Buongiorno", q: "Come valuti la tua esperienza con Televet?", sub: "Basta un clic: 1 stella = molto deluso, 5 stelle = perfetto. Ci aiuta a migliorare.", foot: "Grazie per aver scelto Televet per il tuo animale.", stars: "stelle" },
  en: { s: "How was your Televet appointment?", hi: "Hello", q: "How would you rate your experience with Televet?", sub: "One click is enough: 1 star = very disappointed, 5 stars = perfect. It helps us improve.", foot: "Thank you for trusting Televet with your companion.", stars: "stars" },
  es: { s: "¿Cómo fue tu turno con Televet?", hi: "Hola", q: "¿Cómo calificás tu experiencia con Televet?", sub: "Alcanza con un clic: 1 estrella = muy decepcionado, 5 estrellas = perfecto. Nos ayuda a mejorar.", foot: "Gracias por confiar en Televet para tu compañero.", stars: "estrellas" },
  pt: { s: "Como foi a sua consulta com a Televet?", hi: "Olá", q: "Como avalia a sua experiência com a Televet?", sub: "Basta um clique: 1 estrela = muito desiludido, 5 estrelas = perfeito. Ajuda-nos a melhorar.", foot: "Obrigado por confiar na Televet para o seu companheiro.", stars: "estrelas" },
  de: { s: "Wie war Ihr Termin bei Televet?", hi: "Hallo", q: "Wie bewerten Sie Ihre Erfahrung mit Televet?", sub: "Ein Klick genügt: 1 Stern = sehr enttäuscht, 5 Sterne = perfekt. Das hilft uns, besser zu werden.", foot: "Danke, dass Sie Televet für Ihren Begleiter vertraut haben.", stars: "Sterne" },
  pl: { s: "Jak minęła Twoja wizyta w Televet?", hi: "Dzień dobry", q: "Jak oceniasz swoje doświadczenie z Televet?", sub: "Wystarczy jedno kliknięcie: 1 gwiazdka = bardzo rozczarowany, 5 gwiazdek = idealnie. Pomaga nam to być lepszymi.", foot: "Dziękujemy, że zaufałeś Televet w opiece nad swoim pupilem.", stars: "gwiazdek" },
  nl: { s: "Hoe was uw afspraak bij Televet?", hi: "Hallo", q: "Hoe beoordeelt u uw ervaring met Televet?", sub: "Eén klik is genoeg: 1 ster = zeer teleurgesteld, 5 sterren = perfect. Het helpt ons verbeteren.", foot: "Bedankt dat u Televet vertrouwde met uw trouwe vriend.", stars: "sterren" },
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const reviewUrl = (lang: string, country: string, token: string, rating?: number) => `${SITE}/${lang}/${country.toLowerCase()}/avis/${token}${rating ? `?r=${rating}` : ""}`;

export function reviewEmail(lang: string, name: string, country: string, token: string) {
  const t = T[lang] ?? T.en, l = T[lang] ? lang : "en";
  const star = (n: number) => `<a href="${reviewUrl(l, country, token, n)}" aria-label="${n} ${t.stars}" style="display:inline-block;text-decoration:none;text-align:center;margin:0 3px"><span style="display:block;font-size:34px;line-height:40px;color:#f5b301">★</span><span style="display:block;font-size:13px;color:#526077;font-family:Arial,sans-serif">${n}</span></a>`;
  const html = `<!doctype html><html><body style="margin:0;background:#F6F8FB;font-family:Arial,Helvetica,sans-serif;color:#0F172A"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border:1px solid #E3E8EF;border-radius:14px"><tr><td style="padding:26px;text-align:center">
<p style="margin:0 0 14px;font-size:20px;font-weight:bold;color:#053ABE;text-align:left">televet</p>
<p style="margin:0 0 8px;font-size:16px;text-align:left">${esc(t.hi)}${name ? ` ${esc(name)}` : ""},</p>
<p style="margin:0 0 6px;font-size:18px;font-weight:bold">${esc(t.q)}</p>
<p style="margin:0 0 18px;font-size:14px;color:#526077">${esc(t.sub)}</p>
<div>${[1, 2, 3, 4, 5].map(star).join("")}</div>
<p style="margin:22px 0 0;font-size:13px;color:#526077">${esc(t.foot)}</p></td></tr></table></td></tr></table></body></html>`;
  return { subject: t.s, html };
}

/** Sends the survey for one booking (idempotent: marks review_sent_at). */
export async function sendReviewRequest(bookingId: string) {
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, owner_id, review_token, review_sent_at, practices(country)").eq("id", bookingId).single();
  if (!b || b.review_sent_at) return false;
  const { data: owner } = await db.from("owners").select("full_name, language").eq("id", b.owner_id).single();
  const { data: u } = await db.auth.admin.getUserById(b.owner_id);
  const to = u.user?.email;
  await db.from("bookings").update({ review_sent_at: new Date().toISOString() }).eq("id", bookingId); // mark first: never send twice
  if (!to) return false;
  const country = (b as unknown as { practices: { country: string } }).practices?.country ?? "FR";
  const m = reviewEmail(owner?.language ?? "fr", (owner?.full_name ?? "").split(" ")[0], country, b.review_token);
  await sendEmail(to, m.subject, m.html);
  return true;
}
