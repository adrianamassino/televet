"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

const T: Record<string, Record<string, string>> = {
  fr: { title: "Vous travaillez dans cette clinique ?", lead: "Revendiquez la fiche gratuitement : vous pourrez la compléter et recevoir des rendez-vous en ligne.", signup: "Créer mon compte pro", login: "J'ai déjà un compte", email: "E-mail professionnel (sur le domaine du site de la clinique)", send: "Recevoir le code", code: "Code reçu par e-mail", verify: "Valider", done: "Fiche revendiquée. Complétez maintenant votre profil.", next: "Compléter mon profil", other: "Pas d'e-mail sur le domaine du site ? Écrivez-nous à contact@televet.co avec un justificatif (Kbis, inscription à l'Ordre).", notify: "Prévenez-moi quand cette clinique prendra les rendez-vous en ligne", notifyBtn: "Me prévenir", notified: "C'est noté : nous vous écrirons.", yourEmail: "Votre e-mail" },
  en: { title: "Do you work at this clinic?", lead: "Claim the listing for free: complete it and receive online bookings.", signup: "Create my pro account", login: "I already have an account", email: "Work e-mail (on the clinic website's domain)", send: "Get the code", code: "Code received by e-mail", verify: "Confirm", done: "Listing claimed. Now complete your profile.", next: "Complete my profile", other: "No e-mail on the website's domain? Write to contact@televet.co with proof (registration, licence).", notify: "Tell me when this clinic takes online bookings", notifyBtn: "Notify me", notified: "Noted: we will write to you.", yourEmail: "Your e-mail" },
};

/** Claim a directory listing (vet) or ask to be told when it opens online booking (pet owner). */
export function ClaimListing({ lang, country, listingId }: { lang: string; country: string; listingId: string }) {
  const t = T[lang.split("-")[0]] ?? T.en, rel = `/${lang}/${country}`;
  const [signed, setSigned] = useState<boolean | null>(null), [email, setEmail] = useState(""), [code, setCode] = useState(""), [claimId, setClaimId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ m: string; bad?: boolean } | null>(null), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  const [mail2, setMail2] = useState(""), [notified, setNotified] = useState(false);
  useEffect(() => { supabaseBrowser().auth.getSession().then(({ data }) => setSigned(!!data.session)); }, []);

  async function call(path: string, body: object) {
    const { data } = await supabaseBrowser().auth.getSession();
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? String(r.status));
    return j;
  }
  async function send() { setBusy(true); setMsg(null); try { const j = await call(`/api/directory/${listingId}/claim`, { method: "email_domain", email }); setClaimId(j.claimId); } catch (e) { setMsg({ m: (e as Error).message, bad: true }); } setBusy(false); }
  async function verify() { setBusy(true); setMsg(null); try { await call(`/api/directory/claims/${claimId}/verify`, { code }); setDone(true); } catch (e) { setMsg({ m: (e as Error).message, bad: true }); } setBusy(false); }
  async function notify() { try { await fetch(`/api/directory/${listingId}/interest`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: mail2 }) }); setNotified(true); } catch { /* ignore */ } }

  return <>
    <section className="panel" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20 }}>{t.title}</h2><p>{t.lead}</p>
      {done ? <p><strong>{t.done}</strong> <a className="btn" href={`${rel}/pro/inscription`}>{t.next}</a></p>
        : signed === false ? <p style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><a className="btn" href={`${rel}/pro/inscription`}>{t.signup}</a><a className="btn btn-ghost" href={`${rel}/pro/dashboard`}>{t.login}</a></p>
        : signed ? (claimId
          ? <p style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><input className="field" style={{ maxWidth: 180 }} inputMode="numeric" maxLength={6} placeholder={t.code} aria-label={t.code} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /><button className="btn" disabled={busy || code.length !== 6} onClick={verify}>{t.verify}</button></p>
          : <p style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><input className="field" style={{ maxWidth: 360 }} type="email" placeholder={t.email} aria-label={t.email} value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn" disabled={busy || !email.includes("@")} onClick={send}>{t.send}</button></p>)
        : null}
      {msg && <p className={msg.bad ? "alert" : ""}>{msg.m}</p>}
      <p><small>{t.other}</small></p>
    </section>
    <section className="panel" style={{ marginTop: 16 }}>
      <p>{t.notify}</p>
      {notified ? <p className="ok-p">{t.notified}</p> : <p style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><input className="field" style={{ maxWidth: 320 }} type="email" placeholder={t.yourEmail} aria-label={t.yourEmail} value={mail2} onChange={(e) => setMail2(e.target.value)} /><button className="btn btn-ghost" disabled={!mail2.includes("@")} onClick={notify}>{t.notifyBtn}</button></p>}
    </section>
  </>;
}
