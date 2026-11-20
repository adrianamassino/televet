import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { COUNTRIES } from "@/lib/countries";
import ReturnToApp from "@/components/ReturnToApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Televet", robots: { index: false, follow: false } };

const T: Record<string, Record<string, string>> = {
  fr: { ok: "Paiement reçu", okP: "Votre demande de rendez-vous est enregistrée. Vous recevrez un e-mail de confirmation.", wait: "Paiement en cours de vérification", waitP: "Nous attendons la confirmation du paiement. Vous recevrez un e-mail dès qu'il est validé.", ko: "Le paiement n'a pas abouti", koP: "Aucun montant n'a été débité. Vous pouvez réessayer depuis votre espace.", account: "Voir mes rendez-vous", app: "Revenir à l'application" },
  it: { ok: "Pagamento ricevuto", okP: "La tua richiesta di appuntamento è registrata. Riceverai un'e-mail di conferma.", wait: "Pagamento in verifica", waitP: "Stiamo aspettando la conferma del pagamento. Riceverai un'e-mail appena è convalidato.", ko: "Il pagamento non è andato a buon fine", koP: "Non è stato addebitato nulla. Puoi riprovare dal tuo spazio.", account: "Vedi i miei appuntamenti", app: "Torna all'app" },
  en: { ok: "Payment received", okP: "Your appointment request is saved. You'll get a confirmation e-mail.", wait: "Payment being verified", waitP: "We're waiting for the payment to be confirmed. You'll get an e-mail as soon as it is.", ko: "The payment didn't go through", koP: "Nothing was charged. You can try again from your account.", account: "See my appointments", app: "Back to the app" },
  es: { ok: "Pago recibido", okP: "Tu solicitud de cita está registrada. Recibirás un e-mail de confirmación.", wait: "Pago en verificación", waitP: "Estamos esperando la confirmación del pago. Recibirás un e-mail en cuanto se valide.", ko: "El pago no se completó", koP: "No se cobró nada. Puedes volver a intentarlo desde tu espacio.", account: "Ver mis citas", app: "Volver a la app" },
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type P = { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; app?: string }> };

/** Where Mercado Pago sends the client back after paying (and a generic "payment result" page). Shows no personal data. */
export default async function Page({ params, searchParams }: P) {
  const { id } = await params; const sp = await searchParams;
  if (!UUID.test(id)) notFound();
  const db = adminClient();
  const { data: b } = await db.from("bookings").select("id, payment_status, owner_id, practices(country)").eq("id", id).maybeSingle();
  if (!b) notFound();
  const { data: o } = await db.from("owners").select("language").eq("id", b.owner_id).maybeSingle();
  const cc = ((b as unknown as { practices: { country: string } | null }).practices?.country ?? "FR").toUpperCase();
  const lang = T[o?.language ?? ""] ? (o!.language as string) : T[COUNTRIES[cc]?.languages[0] ?? ""] ? COUNTRIES[cc].languages[0] : "en";
  const t = T[lang];
  const paid = b.payment_status === "authorized" || b.payment_status === "captured" || sp.paid === "1";
  const failed = !paid && (b.payment_status === "failed" || sp.paid === "0");
  const state = paid ? "ok" : failed ? "ko" : "wait";
  const siteLang = COUNTRIES[cc]?.languages.includes(lang) ? lang : COUNTRIES[cc]?.languages[0] ?? "fr";
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a2a9c 0%,#0a3fd6 30%,#1e7bff 62%,#22b8ea 86%,#3fd9c9 110%)", padding: "28px 16px 40px", fontFamily: "var(--body)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <p style={{ textAlign: "center", margin: 0 }}><img src="/logo-white.svg" alt="Televet" style={{ height: 34, width: "auto" }} /></p>
      <section style={{ maxWidth: 460, margin: "22px auto 0", background: "#fff", borderRadius: 26, padding: 24, boxShadow: "0 30px 60px -30px rgba(4,16,70,.7)" }}>
        <h1 style={{ margin: "0 0 10px", color: "#0b1f5c", font: "700 24px/1.2 var(--display)" }}>{t[state]}</h1>
        <p style={{ color: "#4a5a8a", margin: "0 0 20px", maxWidth: "none" }}>{t[`${state}P`]}</p>
        {sp.app === "1"
          ? <ReturnToApp url={`televet://paid?booking=${id}&status=${state === "ko" ? "failed" : state === "ok" ? "ok" : "pending"}`} label={t.app} />
          : <a href={`/${siteLang}/${cc.toLowerCase()}/compte`} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52, borderRadius: 999, background: "linear-gradient(135deg,#0a2a9c,#0a3fd6 55%,#1e7bff)", color: "#fff", font: "600 17px var(--body)", textDecoration: "none" }}>{t.account}</a>}
      </section>
    </main>
  );
}
