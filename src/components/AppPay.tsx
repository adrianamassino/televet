"use client";
import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ZERO_DECIMAL } from "@/lib/countries";

/**
 * Card payment page opened by the mobile apps in a browser sheet (the booking and its PaymentIntent already exist).
 * URL: /m/pay?lang=it&booking=<id>&scheme=televet#cs=<client secret>   (the secret stays in the fragment: never sent to a server or logged)
 * When the payment is authorised the page hands control back to the app through its link scheme.
 */
const T: Record<string, Record<string, string>> = {
  fr: { title: "Paiement sécurisé", total: "Total", pay: "Payer", paying: "Un instant…", note: "Le vétérinaire doit accepter le rendez-vous : s'il le refuse, vous n'êtes pas débité.", done: "Paiement autorisé", doneP: "Vous pouvez revenir à l'application.", back: "Revenir à l'application", cancel: "Annuler", err: "Le paiement n'a pas abouti : ", bad: "Ce lien de paiement n'est plus valable. Revenez à l'application et réessayez." },
  it: { title: "Pagamento sicuro", total: "Totale", pay: "Paga", paying: "Un momento…", note: "Il veterinario deve accettare l'appuntamento: se lo rifiuta, non ti viene addebitato nulla.", done: "Pagamento autorizzato", doneP: "Puoi tornare all'app.", back: "Torna all'app", cancel: "Annulla", err: "Il pagamento non è andato a buon fine: ", bad: "Questo link di pagamento non è più valido. Torna all'app e riprova." },
  en: { title: "Secure payment", total: "Total", pay: "Pay", paying: "One moment…", note: "The vet has to accept the appointment: if they decline, you are not charged.", done: "Payment authorised", doneP: "You can go back to the app.", back: "Back to the app", cancel: "Cancel", err: "The payment didn't go through: ", bad: "This payment link is no longer valid. Go back to the app and try again." },
  es: { title: "Pago seguro", total: "Total", pay: "Pagar", paying: "Un momento…", note: "El veterinario debe aceptar la cita: si la rechaza, no se te cobra nada.", done: "Pago autorizado", doneP: "Puedes volver a la app.", back: "Volver a la app", cancel: "Cancelar", err: "El pago no se completó: ", bad: "Este enlace de pago ya no es válido. Vuelve a la app e inténtalo de nuevo." },
};
const SCHEMES = new Set(["televet", "exp+televet"]);
const OK = new Set(["requires_capture", "succeeded", "processing"]);

const wrap: React.CSSProperties = { minHeight: "100vh", margin: 0, background: "linear-gradient(160deg,#0a2a9c 0%,#0a3fd6 30%,#1e7bff 62%,#22b8ea 86%,#3fd9c9 110%)", padding: "28px 16px 40px", fontFamily: "var(--body)" };
const card: React.CSSProperties = { maxWidth: 460, margin: "22px auto 0", background: "#fff", borderRadius: 26, padding: 22, boxShadow: "0 30px 60px -30px rgba(4,16,70,.7)" };
const btn: React.CSSProperties = { width: "100%", minHeight: 52, border: 0, borderRadius: 999, background: "linear-gradient(135deg,#0a2a9c,#0a3fd6 55%,#1e7bff)", color: "#fff", font: "600 17px var(--body)", cursor: "pointer" };

function Form({ t, lang, cs, onDone }: { t: Record<string, string>; lang: string; cs: string; onDone: () => void }) {
  const stripe = useStripe(), elements = useElements();
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [amount, setAmount] = useState("");
  useEffect(() => {
    if (!stripe) return;
    stripe.retrievePaymentIntent(cs).then(({ paymentIntent, error }) => {
      if (error || !paymentIntent) return setMsg(t.bad);
      if (OK.has(paymentIntent.status)) return onDone(); // already paid (page reloaded, or back from the bank's page)
      if (paymentIntent.status === "canceled") return setMsg(t.bad);
      const cur = paymentIntent.currency.toUpperCase();
      setAmount(new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? paymentIntent.amount : paymentIntent.amount / 100));
    });
  }, [stripe, cs, lang, t, onDone]);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault(); if (!stripe || !elements) return; setBusy(true); setMsg("");
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required", confirmParams: { return_url: window.location.href } });
      setBusy(false);
      if (error) setMsg(t.err + (error.message ?? "")); else if (!paymentIntent || OK.has(paymentIntent.status)) onDone(); else setMsg(t.err + paymentIntent.status);
    }}>
      {amount && <p style={{ margin: "0 0 14px", color: "#0b1f5c", font: "600 20px var(--body)" }}>{t.total}: {amount}</p>}
      <PaymentElement />
      <p style={{ fontSize: 14, color: "#4a5a8a", margin: "14px 0" }}>{t.note}</p>
      <button style={{ ...btn, opacity: busy || !stripe ? 0.6 : 1 }} disabled={busy || !stripe}>{busy ? t.paying : `${t.pay}${amount ? ` ${amount}` : ""}`}</button>
      {msg && <p role="alert" style={{ color: "#b3261e", fontSize: 15, margin: "12px 0 0" }}>{msg}</p>}
    </form>
  );
}

export default function AppPay({ stripeKey }: { stripeKey?: string }) {
  const [p, setP] = useState<{ cs: string; lang: string; booking: string; scheme: string } | null>(null), [done, setDone] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search), h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const scheme = q.get("scheme") ?? "televet";
    setP({ cs: h.get("cs") ?? q.get("payment_intent_client_secret") ?? "", lang: (q.get("lang") ?? "en").slice(0, 2), booking: q.get("booking") ?? "", scheme: SCHEMES.has(scheme) ? scheme : "televet" });
  }, []);
  const stripePromise = useMemo(() => (stripeKey ? loadStripe(stripeKey) : null), [stripeKey]);
  const t = T[p?.lang ?? "en"] ?? T.en;
  const back = (status: string) => `${p?.scheme ?? "televet"}://paid?booking=${encodeURIComponent(p?.booking ?? "")}&status=${status}`;
  useEffect(() => { if (done && p) window.location.replace(back("ok")); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [done, p]);
  return (
    <main style={wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <p style={{ textAlign: "center", margin: 0 }}><img src="/logo-white.svg" alt="Televet" style={{ height: 34, width: "auto" }} /></p>
      <section style={card}>
        <h1 style={{ margin: "0 0 14px", color: "#0b1f5c", font: "700 24px/1.2 var(--display)" }}>{done ? t.done : t.title}</h1>
        {!p ? <p>…</p> : done ? <><p style={{ color: "#4a5a8a" }}>{t.doneP}</p><a href={back("ok")} style={{ ...btn, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>{t.back}</a></>
          : !stripePromise || !p.cs ? <p role="alert" style={{ color: "#b3261e" }}>{t.bad}</p>
          : <Elements stripe={stripePromise} options={{ clientSecret: p.cs, locale: p.lang as "fr", appearance: { theme: "stripe", variables: { colorPrimary: "#0a3fd6", borderRadius: "12px" } } }}><Form t={t} lang={p.lang} cs={p.cs} onDone={() => setDone(true)} /></Elements>}
        {p && !done && <p style={{ textAlign: "center", margin: "16px 0 0" }}><a href={back("cancel")} style={{ color: "#4a5a8a", fontSize: 15 }}>{t.cancel}</a></p>}
      </section>
    </main>
  );
}
