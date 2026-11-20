"use client";
import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { VI } from "@/components/VI";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { errText, signInWithEmail, signInWithProvider, signUpWithEmail, supabaseBrowser } from "@/lib/auth-client";
import { ZERO_DECIMAL } from "@/lib/countries";

/** Owner booking: service → time → account → pet & reason → payment. Server re-checks availability, zone and payment (/api/bookings). */
export interface SvcIn { id: string; type: "video" | "home" | "clinic" | "expertise"; name: string | null; duration: number; price: number; currency: string; onlinePayment: boolean }
interface Props { lang: string; country: string; slug: string; practiceName: string; practitionerId: string; timezone: string; services: SvcIn[]; preselect?: string; stripeKey?: string }
type Slot = { start: string; end: string; day: string };
type Pet = { id: string; name: string; species: string };

const T = {
  fr: { svc: "Choisissez la consultation", slot: "Choisissez un horaire", none: "Aucun créneau disponible pour le moment.", more: "Jours suivants", account: "Connectez-vous pour réserver", name: "Votre nom", email: "E-mail", pass: "Mot de passe (8 caractères minimum)", create: "Créer mon compte", login: "Me connecter", have: "J'ai déjà un compte", google: "Continuer avec Google", apple: "Continuer avec Apple", or: "ou avec votre e-mail", checkMail: "E-mail de confirmation envoyé : cliquez sur le lien puis revenez ici.",
    pet: "Votre animal", newPet: "Nouvel animal", petName: "Nom", species: { dog: "Chien", cat: "Chat", rabbit: "Lapin", ferret: "Furet", bird: "Oiseau", horse: "Cheval", other: "Autre" }, motive: "Motif de la consultation", address: "Adresse de la visite", access: "Code, étage, indications d'accès", consent: "J'accepte que l'échange soit enregistré et transcrit pour préparer le compte rendu (facultatif).",
    go: "Continuer", back: "Retour", pay: "Payer et envoyer la demande", send: "Envoyer la demande", paying: "Un instant…", total: "Total", notCharged: "Le vétérinaire doit accepter le rendez-vous : s'il le refuse, vous n'êtes pas débité (ou vous êtes remboursé).",
    doneT: "Demande envoyée", done: "Le vétérinaire va confirmer votre rendez-vous. Vous recevrez un e-mail de confirmation.", err: "Un problème est survenu : ", taken: "Ce créneau vient d'être pris, choisissez-en un autre.", zone: "Ce vétérinaire ne se déplace pas à cette adresse.", nopay: "Ce vétérinaire n'a pas encore activé les paiements en ligne.", home: "Retour à l'accueil", types: { video: "En visio", home: "À domicile", clinic: "En clinique", expertise: "Avis d'expert" } },
  it: { svc: "Scegli la visita", slot: "Scegli un orario", none: "Nessun orario disponibile al momento.", more: "Giorni successivi", account: "Accedi per prenotare", name: "Il tuo nome", email: "E-mail", pass: "Password (minimo 8 caratteri)", create: "Crea il mio account", login: "Accedi", have: "Ho già un account", google: "Continua con Google", apple: "Continua con Apple", or: "oppure con la tua e-mail", checkMail: "E-mail di conferma inviata: clicca il link e torna qui.",
    pet: "Il tuo animale", newPet: "Nuovo animale", petName: "Nome", species: { dog: "Cane", cat: "Gatto", rabbit: "Coniglio", ferret: "Furetto", bird: "Uccello", horse: "Cavallo", other: "Altro" }, motive: "Motivo della visita", address: "Indirizzo della visita", access: "Citofono, piano, indicazioni", consent: "Accetto che la conversazione sia registrata e trascritta per preparare il referto (facoltativo).",
    go: "Continua", back: "Indietro", pay: "Paga e invia la richiesta", send: "Invia la richiesta", paying: "Un momento…", total: "Totale", notCharged: "Il veterinario deve accettare l'appuntamento: se lo rifiuta, non vieni addebitato (o vieni rimborsato).",
    doneT: "Richiesta inviata", done: "Il veterinario confermerà il tuo appuntamento. Riceverai un'e-mail di conferma.", err: "Si è verificato un problema: ", taken: "Questo orario è appena stato preso, sceglierne un altro.", zone: "Questo veterinario non si sposta a questo indirizzo.", nopay: "Questo veterinario non ha ancora attivato i pagamenti online.", home: "Torna alla home", types: { video: "In video", home: "A domicilio", clinic: "In clinica", expertise: "Parere esperto" } },
  en: { svc: "Choose the consultation", slot: "Choose a time", none: "No time slots available right now.", more: "Next days", account: "Sign in to book", name: "Your name", email: "E-mail", pass: "Password (8 characters minimum)", create: "Create my account", login: "Sign in", have: "I already have an account", google: "Continue with Google", apple: "Continue with Apple", or: "or with your e-mail", checkMail: "Confirmation e-mail sent: click the link, then come back here.",
    pet: "Your pet", newPet: "New pet", petName: "Name", species: { dog: "Dog", cat: "Cat", rabbit: "Rabbit", ferret: "Ferret", bird: "Bird", horse: "Horse", other: "Other" }, motive: "Reason for the visit", address: "Visit address", access: "Door code, floor, access notes", consent: "I agree to the conversation being recorded and transcribed to prepare the report (optional).",
    go: "Continue", back: "Back", pay: "Pay and send the request", send: "Send the request", paying: "One moment…", total: "Total", notCharged: "The vet has to accept the appointment: if they decline, you are not charged (or you are refunded).",
    doneT: "Request sent", done: "The vet will confirm your appointment. You'll get a confirmation e-mail.", err: "Something went wrong: ", taken: "That slot was just taken, please pick another one.", zone: "This vet doesn't visit that address.", nopay: "This vet hasn't enabled online payments yet.", home: "Back to home", types: { video: "By video", home: "At home", clinic: "At the clinic", expertise: "Expert opinion" } },
  es: { svc: "Elige la consulta", slot: "Elige un horario", none: "No hay horarios disponibles por ahora.", more: "Días siguientes", account: "Entra para reservar", name: "Tu nombre", email: "E-mail", pass: "Contraseña (mínimo 8 caracteres)", create: "Crear mi cuenta", login: "Entrar", have: "Ya tengo cuenta", google: "Continuar con Google", apple: "Continuar con Apple", or: "o con tu e-mail", checkMail: "E-mail de confirmación enviado: haz clic en el enlace y vuelve aquí.",
    pet: "Tu mascota", newPet: "Nueva mascota", petName: "Nombre", species: { dog: "Perro", cat: "Gato", rabbit: "Conejo", ferret: "Hurón", bird: "Ave", horse: "Caballo", other: "Otro" }, motive: "Motivo de la consulta", address: "Dirección de la visita", access: "Portero, piso, indicaciones", consent: "Acepto que la conversación se grabe y transcriba para preparar el informe (opcional).",
    go: "Continuar", back: "Atrás", pay: "Pagar y enviar la solicitud", send: "Enviar la solicitud", paying: "Un momento…", total: "Total", notCharged: "El veterinario debe aceptar la cita: si la rechaza, no se te cobra (o se te reembolsa).",
    doneT: "Solicitud enviada", done: "El veterinario confirmará tu cita. Recibirás un e-mail de confirmación.", err: "Hubo un problema: ", taken: "Ese horario acaba de ocuparse, elige otro.", zone: "Este veterinario no atiende en esa dirección.", nopay: "Este veterinario aún no activó los pagos online.", home: "Volver al inicio", types: { video: "Por video", home: "A domicilio", clinic: "En clínica", expertise: "Opinión experta" } },
  pl: { svc: "Wybierz konsultację", slot: "Wybierz godzinę", none: "Obecnie brak wolnych terminów.", more: "Kolejne dni", account: "Zaloguj się, aby zarezerwować", name: "Imię i nazwisko", email: "E-mail", pass: "Hasło (min. 8 znaków)", create: "Utwórz konto", login: "Zaloguj się", have: "Mam już konto", google: "Kontynuuj z Google", apple: "Kontynuuj z Apple", or: "lub e-mailem", checkMail: "Wysłaliśmy e-mail z potwierdzeniem: kliknij link i wróć tutaj.",
    pet: "Twoje zwierzę", newPet: "Nowe zwierzę", petName: "Imię", species: { dog: "Pies", cat: "Kot", rabbit: "Królik", ferret: "Fretka", bird: "Ptak", horse: "Koń", other: "Inne" }, motive: "Powód wizyty", address: "Adres wizyty", access: "Kod do domofonu, piętro, wskazówki", consent: "Zgadzam się na nagranie i transkrypcję rozmowy w celu przygotowania raportu (opcjonalnie).",
    go: "Dalej", back: "Wstecz", pay: "Zapłać i wyślij prośbę", send: "Wyślij prośbę", paying: "Chwileczkę…", total: "Razem", notCharged: "Weterynarz musi przyjąć wizytę: jeśli ją odrzuci, nie zostaniesz obciążony (lub dostaniesz zwrot).",
    doneT: "Prośba wysłana", done: "Weterynarz potwierdzi Twoją wizytę. Otrzymasz e-mail z potwierdzeniem.", err: "Wystąpił problem: ", taken: "Ten termin został właśnie zajęty, wybierz inny.", zone: "Ten weterynarz nie dojeżdża pod ten adres.", nopay: "Ten weterynarz nie włączył jeszcze płatności online.", home: "Wróć na stronę główną", types: { video: "Wideo", home: "W domu", clinic: "W klinice", expertise: "Opinia eksperta" } },
} as const;


function PayForm({ t, onDone, onErr }: { t: (typeof T)["en"]; onDone: () => void; onErr: (m: string) => void }) {
  const stripe = useStripe(), elements = useElements(); const [busy, setBusy] = useState(false);
  return <form onSubmit={async (e) => { e.preventDefault(); if (!stripe || !elements) return; setBusy(true);
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required", confirmParams: { return_url: window.location.href } });
    setBusy(false); if (error) onErr(error.message ?? "payment"); else onDone(); }}>
    <PaymentElement /><p style={{ fontSize: 14 }}>{t.notCharged}</p>
    <button className="btn" disabled={busy || !stripe}>{busy ? t.paying : t.pay}</button></form>;
}

export default function BookingFlow({ lang, country, practiceName, practitionerId, timezone, services, preselect, stripeKey }: Props) {
  const t = (T[lang as keyof typeof T] ?? T.en) as (typeof T)["en"];
  const [step, setStep] = useState<"svc" | "slot" | "auth" | "details" | "pay" | "done">(services.length === 1 || preselect ? "slot" : "svc");
  const [svc, setSvc] = useState<SvcIn | undefined>(services.length === 1 ? services[0] : services.find((s) => s.id === preselect));
  const [slots, setSlots] = useState<Slot[] | null>(null), [slot, setSlot] = useState<Slot | null>(null), [offset, setOffset] = useState(0);
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [signedIn, setSignedIn] = useState(false);
  const [login, setLogin] = useState(false), [name, setName] = useState(""), [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [pets, setPets] = useState<Pet[]>([]), [petId, setPetId] = useState(""), [petName, setPetName] = useState(""), [species, setSpecies] = useState("dog");
  const [motive, setMotive] = useState(""), [address, setAddress] = useState(""), [access, setAccess] = useState(""), [consent, setConsent] = useState(false);
  const [secret, setSecret] = useState(""), [price, setPrice] = useState(0);
  const stripePromise = useMemo(() => (stripeKey ? loadStripe(stripeKey) : null), [stripeKey]);
  const err = (m: string) => setMsg(t.err + m);
  const here = typeof window === "undefined" ? "" : window.location.pathname + window.location.search;

  useEffect(() => { supabaseBrowser().auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);
  useEffect(() => {
    if (step !== "slot" || !svc) return;
    setSlots(null);
    const from = new Date(Date.now() + offset * 7 * 86400000).toISOString().slice(0, 10);
    fetch(`/api/availability?service=${svc.id}&practitioner=${practitionerId}&from=${from}&days=7`).then((r) => r.json()).then((j) => setSlots(j.slots ?? [])).catch(() => setSlots([]));
  }, [step, svc, offset, practitionerId]);

  const money = (c: number, cur: string) => new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? c : c / 100);
  const dayLabel = (iso: string) => new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(new Date(iso));
  const hour = (iso: string) => new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(iso));
  const grouped = useMemo(() => { const m = new Map<string, Slot[]>(); (slots ?? []).forEach((s) => m.set(s.day, [...(m.get(s.day) ?? []), s])); return [...m.entries()]; }, [slots]);

  async function ensureOwnerAndPets(userId: string, fullName?: string) {
    const sb = supabaseBrowser();
    await sb.from("owners").upsert({ id: userId, full_name: fullName ?? "", country, language: lang }, { onConflict: "id", ignoreDuplicates: true });
    const { data } = await sb.from("pets").select("id, name, species").order("created_at");
    setPets(data ?? []); setPetId(data?.[0]?.id ?? "");
  }
  async function toDetails() {
    const { data } = await supabaseBrowser().auth.getUser(); if (data.user) { await ensureOwnerAndPets(data.user.id); setSignedIn(true); setStep("details"); }
  }
  async function auth() {
    setBusy(true); setMsg("");
    try {
      if (login) { const { error } = await signInWithEmail(email, pass); if (error) throw error; await toDetails(); }
      else {
        if (pass.length < 8) throw new Error(t.pass);
        const { data, error } = await signUpWithEmail(email, pass, name); if (error) throw error;
        if (data.session) { await ensureOwnerAndPets(data.user!.id, name); setSignedIn(true); setStep("details"); } else setMsg(t.checkMail);
      }
    } catch (e) { err(errText(e)); }
    setBusy(false);
  }
  async function submit() {
    if (!svc || !slot) return;
    setBusy(true); setMsg("");
    try {
      const sb = supabaseBrowser(); let pid = petId;
      if (!pid || pid === "new") {
        const { data: u } = await sb.auth.getUser();
        const { data: p, error } = await sb.from("pets").insert({ owner_id: u.user!.id, name: petName, species }).select("id").single(); if (error) throw error; pid = p.id;
      }
      const { data: s } = await sb.auth.getSession();
      const r = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${s.session?.access_token}` },
        body: JSON.stringify({ serviceId: svc.id, practitionerId, start: slot.start, petId: pid, motive: motive || undefined, address: svc.type === "home" ? address : undefined, accessNotes: access || undefined, transcriptConsent: svc.type === "video" ? consent : undefined }) });
      const j = await r.json();
      if (!r.ok) { setBusy(false); return setMsg(j.error === "slot_unavailable" ? t.taken : j.error === "out_of_zone" ? t.zone : j.error === "payments_not_enabled" ? t.nopay : t.err + (j.error ?? r.status)); }
      if (!j.payment) setStep("done");
      else if (j.payment.provider === "stripe") { setSecret(j.payment.clientSecret); setPrice(svc.price); setStep("pay"); }
      else window.location.href = j.payment.redirectUrl;
    } catch (e) { err(errText(e)); }
    setBusy(false);
  }

  const needsPay = !!svc?.onlinePayment;
  const detailsOk = !!svc && (petId && petId !== "new" ? true : petName.trim().length > 0) && (svc.type !== "home" || address.trim().length > 5);
  return (
    <div>
      <p style={{ margin: 0 }}><small>{practiceName}</small></p>
      {svc && step !== "svc" && step !== "done" && <p><strong>{svc.name ?? t.types[svc.type]}</strong> · {svc.duration} min · {money(svc.price, svc.currency)}{slot && <> · {dayLabel(slot.start)} {hour(slot.start)}</>}</p>}
      {step === "svc" && <section><h2>{t.svc}</h2>{services.map((s) => <button key={s.id} className="btn btn-ghost choice" style={{ gap: 14, padding: "10px 16px", height: "auto" }} onClick={() => { setSvc(s); setStep("slot"); }}>
        <span className={`ico sm ${({ video: "t-coral", home: "t-mint", clinic: "t-sky", expertise: "t-lilac" } as const)[s.type]}`} aria-hidden><VI n={({ video: "monitor", home: "housePaw", clinic: "clinic", expertise: "stethoscope" } as const)[s.type]} size={30} /></span><span><strong>{s.name ?? t.types[s.type]}</strong><br /><small>{t.types[s.type]} · {s.duration} min · {money(s.price, s.currency)}</small></span></button>)}</section>}
      {step === "slot" && <section><h2>{t.slot}</h2>
        {slots === null ? <p>…</p> : grouped.length === 0 ? <p>{t.none}</p> : grouped.map(([day, list]) => <div key={day} style={{ margin: "10px 0" }}>
          <strong style={{ textTransform: "capitalize" }}>{dayLabel(list[0].start)}</strong>
          <div className="slots">{list.map((s) => <button key={s.start} className="btn btn-ghost" onClick={async () => { setSlot(s); const { data } = await supabaseBrowser().auth.getUser(); if (data.user) { await ensureOwnerAndPets(data.user.id); setStep("details"); } else setStep("auth"); }}>{hour(s.start)}</button>)}</div></div>)}
        <p>{offset > 0 && <button className="btn btn-ghost" onClick={() => setOffset(offset - 1)}>{t.back}</button>} <button className="btn btn-ghost" onClick={() => setOffset(offset + 1)}>{t.more}</button>
          {services.length > 1 && <> <button className="btn btn-quiet" onClick={() => { setSvc(undefined); setStep("svc"); }}>{t.svc}</button></>}</p></section>}
      {step === "auth" && <section><h2>{t.account}</h2>
        <div className="oauth"><button className="btn btn-ghost oauth-btn" onClick={() => signInWithProvider("google", here)}><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>{t.google}</button>
          <button className="btn btn-ghost oauth-btn" onClick={() => signInWithProvider("apple", here)}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.400 1.200 9.800.8 1.200 1.800 2.500 3 2.400 1.200 0 1.700-.8 3.100-.8s1.900.8 3.200.8 2.100-1.200 2.900-2.400c.9-1.300 1.300-2.700 1.300-2.700s-2.500-1-2.400-3.700zM14 5.500c.7-.8 1.100-1.900 1-3-.9 0-2.100.6-2.800 1.400-.6.700-1.200 1.800-1 2.900 1.100.1 2.100-.5 2.800-1.300z"/></svg>{t.apple}</button></div>
        <p className="oauth-or"><span>{t.or}</span></p>
        {!login && <><label className="label">{t.name}</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></>}
        <label className="label">{t.email}</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">{t.pass}</label><input className="field" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <p><button className="btn" disabled={busy || !email || !pass || (!login && !name)} onClick={auth}>{login ? t.login : t.create}</button> <button className="btn btn-quiet" onClick={() => setLogin(!login)}>{login ? t.create : t.have}</button></p></section>}
      {step === "details" && svc && <section><h2>{t.pet}</h2>
        <select className="field" value={petId || "new"} onChange={(e) => setPetId(e.target.value)}>{pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="new">{t.newPet}</option></select>
        {(petId === "new" || pets.length === 0) && <div className="row" style={{ marginTop: 8 }}><input className="field" placeholder={t.petName} value={petName} onChange={(e) => setPetName(e.target.value)} />
          <select className="field" value={species} onChange={(e) => setSpecies(e.target.value)}>{Object.entries(t.species).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>}
        <label className="label">{t.motive}</label><textarea className="field" style={{ minHeight: 80 }} maxLength={1000} value={motive} onChange={(e) => setMotive(e.target.value)} />
        {svc.type === "home" && <><label className="label">{t.address}</label><input className="field" value={address} onChange={(e) => setAddress(e.target.value)} /><label className="label">{t.access}</label><input className="field" maxLength={300} value={access} onChange={(e) => setAccess(e.target.value)} /></>}
        {svc.type === "video" && <label style={{ display: "block", margin: "14px 0" }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> {t.consent}</label>}
        {needsPay && <p style={{ fontSize: 14 }}>{t.notCharged}</p>}
        <p><button className="btn btn-ghost" onClick={() => setStep("slot")}>{t.back}</button> <button className="btn" disabled={busy || !detailsOk} onClick={submit}>{busy ? t.paying : needsPay ? t.go : t.send}</button></p></section>}
      {step === "pay" && stripePromise && secret && <section><h2>{t.total}: {money(price, svc!.currency)}</h2>
        <Elements stripe={stripePromise} options={{ clientSecret: secret, locale: lang as "fr" }}><PayForm t={t} onDone={() => setStep("done")} onErr={err} /></Elements></section>}
      {step === "pay" && !stripePromise && <p role="alert">{t.err}NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>}
      {step === "done" && <section><h2>{t.doneT}</h2><p>{t.done}</p><p><a href={`/${lang}/${country.toLowerCase()}/`}>{t.home}</a></p></section>}
      {msg && <p role="alert" className="alert">{msg}</p>}
      {signedIn && step === "svc" && null}
    </div>
  );
}
