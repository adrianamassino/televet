"use client";
import { useEffect, useState } from "react";
import { signInWithEmail, signInWithProvider, signUpWithEmail, supabaseBrowser } from "@/lib/auth-client";
import { ZERO_DECIMAL } from "@/lib/countries";

/**
 * Vet / clinic sign-up: account → practice → services & prices → opening hours.
 * Everything is written from the browser under the Row Level Security rules (a vet can only write their own rows).
 * The profile is created UNPUBLISHED: it goes live once Televet has checked it (set practices.published = true).
 */
type Kind = "clinic" | "vet" | "home";
type Svc = "video" | "home" | "clinic";
const T = {
  fr: { title: "Créer mon profil Televet", account: "Votre compte", name: "Votre nom", email: "E-mail", pass: "Mot de passe (8 caractères minimum)", create: "Créer mon compte", have: "J'ai déjà un compte", login: "Me connecter", google: "Continuer avec Google", checkMail: "Un e-mail de confirmation vient de partir. Cliquez sur le lien, vous reviendrez ici.",
    prac: "Votre activité", kind: { clinic: "Clinique", vet: "Vétérinaire indépendant", home: "Vétérinaire à domicile" }, pname: "Nom affiché (cabinet ou votre nom)", headline: "Une phrase de présentation", address: "Adresse (facultatif pour la visio)", postal: "Code postal", phone: "Téléphone (facultatif)", langs: "Langues parlées",
    svcs: "Vos consultations", svcName: { video: "Consultation en visio", home: "Visite à domicile", clinic: "Consultation en clinique" }, price: "Prix", dur: "Durée (min)", hours: "Vos horaires", days: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"], from: "de", to: "à",
    save: "Enregistrer mon profil", next: "Continuer", back: "Retour", saving: "Enregistrement…", err: "Un problème est survenu : ", needSvc: "Choisissez au moins une consultation avec son prix.", needHours: "Indiquez au moins un créneau d'ouverture.",
    doneT: "Profil enregistré", done: "Votre profil est en cours de vérification par l'équipe Televet, il sera visible dès qu'il sera validé. En attendant, connectez votre compte de paiement.", pay: "Connecter mes paiements", home: "Retour à l'accueil" },
  it: { title: "Crea il mio profilo Televet", account: "Il tuo account", name: "Il tuo nome", email: "E-mail", pass: "Password (minimo 8 caratteri)", create: "Crea il mio account", have: "Ho già un account", login: "Accedi", google: "Continua con Google", checkMail: "Ti abbiamo mandato un'e-mail di conferma. Clicca il link e tornerai qui.",
    prac: "La tua attività", kind: { clinic: "Clinica", vet: "Veterinario indipendente", home: "Veterinario a domicilio" }, pname: "Nome visualizzato (studio o il tuo nome)", headline: "Una frase di presentazione", address: "Indirizzo (facoltativo per il video)", postal: "CAP", phone: "Telefono (facoltativo)", langs: "Lingue parlate",
    svcs: "Le tue visite", svcName: { video: "Visita in video", home: "Visita a domicilio", clinic: "Visita in clinica" }, price: "Prezzo", dur: "Durata (min)", hours: "I tuoi orari", days: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"], from: "dalle", to: "alle",
    save: "Salva il mio profilo", next: "Continua", back: "Indietro", saving: "Salvataggio…", err: "Si è verificato un problema: ", needSvc: "Scegli almeno una visita con il suo prezzo.", needHours: "Indica almeno una fascia di apertura.",
    doneT: "Profilo salvato", done: "Il tuo profilo è in verifica da parte del team Televet e sarà visibile appena convalidato. Nel frattempo collega il tuo conto per i pagamenti.", pay: "Collega i pagamenti", home: "Torna alla home" },
  en: { title: "Create my Televet profile", account: "Your account", name: "Your name", email: "E-mail", pass: "Password (8 characters minimum)", create: "Create my account", have: "I already have an account", login: "Sign in", google: "Continue with Google", checkMail: "A confirmation e-mail has been sent. Click the link and you'll come back here.",
    prac: "Your practice", kind: { clinic: "Clinic", vet: "Independent vet", home: "Home-visit vet" }, pname: "Display name (practice or your name)", headline: "A one-line introduction", address: "Address (optional for video)", postal: "Postal code", phone: "Phone (optional)", langs: "Languages spoken",
    svcs: "Your consultations", svcName: { video: "Video consultation", home: "Home visit", clinic: "Clinic consultation" }, price: "Price", dur: "Duration (min)", hours: "Your opening hours", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], from: "from", to: "to",
    save: "Save my profile", next: "Continue", back: "Back", saving: "Saving…", err: "Something went wrong: ", needSvc: "Choose at least one consultation and its price.", needHours: "Add at least one opening slot.",
    doneT: "Profile saved", done: "Your profile is being checked by the Televet team and will be visible once validated. Meanwhile, connect your payment account.", pay: "Connect my payments", home: "Back to home" },
  es: { title: "Crear mi perfil en Televet", account: "Tu cuenta", name: "Tu nombre", email: "E-mail", pass: "Contraseña (mínimo 8 caracteres)", create: "Crear mi cuenta", have: "Ya tengo cuenta", login: "Entrar", google: "Continuar con Google", checkMail: "Te enviamos un e-mail de confirmación. Haz clic en el enlace y volverás aquí.",
    prac: "Tu actividad", kind: { clinic: "Clínica", vet: "Veterinario independiente", home: "Veterinario a domicilio" }, pname: "Nombre visible (consultorio o tu nombre)", headline: "Una frase de presentación", address: "Dirección (opcional para video)", postal: "Código postal", phone: "Teléfono (opcional)", langs: "Idiomas",
    svcs: "Tus consultas", svcName: { video: "Consulta por video", home: "Visita a domicilio", clinic: "Consulta en clínica" }, price: "Precio", dur: "Duración (min)", hours: "Tus horarios", days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"], from: "de", to: "a",
    save: "Guardar mi perfil", next: "Continuar", back: "Atrás", saving: "Guardando…", err: "Hubo un problema: ", needSvc: "Elige al menos una consulta con su precio.", needHours: "Indica al menos un horario de atención.",
    doneT: "Perfil guardado", done: "Tu perfil está siendo revisado por el equipo de Televet y será visible cuando se valide. Mientras tanto, conecta tu cuenta de pagos.", pay: "Conectar mis pagos", home: "Volver al inicio" },
  pl: { title: "Załóż profil w Televet", account: "Twoje konto", name: "Imię i nazwisko", email: "E-mail", pass: "Hasło (min. 8 znaków)", create: "Utwórz konto", have: "Mam już konto", login: "Zaloguj się", google: "Kontynuuj z Google", checkMail: "Wysłaliśmy e-mail z potwierdzeniem. Kliknij link, a wrócisz tutaj.",
    prac: "Twoja działalność", kind: { clinic: "Klinika", vet: "Weterynarz niezależny", home: "Weterynarz z dojazdem" }, pname: "Wyświetlana nazwa (gabinet lub Twoje nazwisko)", headline: "Jedno zdanie o Tobie", address: "Adres (opcjonalnie dla wideo)", postal: "Kod pocztowy", phone: "Telefon (opcjonalnie)", langs: "Języki",
    svcs: "Twoje konsultacje", svcName: { video: "Konsultacja wideo", home: "Wizyta domowa", clinic: "Wizyta w klinice" }, price: "Cena", dur: "Czas (min)", hours: "Godziny pracy", days: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"], from: "od", to: "do",
    save: "Zapisz profil", next: "Dalej", back: "Wstecz", saving: "Zapisywanie…", err: "Wystąpił problem: ", needSvc: "Wybierz co najmniej jedną konsultację z ceną.", needHours: "Dodaj co najmniej jeden przedział godzin.",
    doneT: "Profil zapisany", done: "Zespół Televet sprawdza Twój profil; będzie widoczny po zatwierdzeniu. W międzyczasie połącz konto płatnicze.", pay: "Połącz płatności", home: "Wróć na stronę główną" },
} as const;

const CATALOG: Record<Svc, string> = { video: "video_consult", home: "home_visit", clinic: "clinic_visit" };
const slugify = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const inp = { width: "100%", padding: 10, border: "1px solid #c9d2e6", borderRadius: 8, font: "inherit", boxSizing: "border-box" } as const;
const btn = { background: "#0b3bbf", color: "#fff", fontWeight: 700, padding: "12px 20px", borderRadius: 10, border: 0, cursor: "pointer", font: "inherit" } as const;
const ghost = { background: "#fff", color: "#0b3bbf", border: "1px solid #0b3bbf", fontWeight: 600, padding: "10px 16px", borderRadius: 10, cursor: "pointer", font: "inherit" } as const;
const label = { display: "block", margin: "12px 0 4px", fontWeight: 600 } as const;

export default function ProSignup({ lang, country, currency, languages, timezone, provider }: { lang: string; country: string; currency: string; languages: string[]; timezone: string; provider: "stripe" | "mercadopago" }) {
  const t = T[lang as keyof typeof T] ?? T.en;
  const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [practiceId, setPracticeId] = useState("");
  const [login, setLogin] = useState(false), [name, setName] = useState(""), [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [kind, setKind] = useState<Kind>("vet"), [pname, setPname] = useState(""), [headline, setHeadline] = useState(""), [address, setAddress] = useState(""), [postal, setPostal] = useState(""), [phone, setPhone] = useState("");
  const [spoken, setSpoken] = useState<string[]>([lang]);
  const [svc, setSvc] = useState<Record<Svc, { on: boolean; price: string; dur: string }>>({ video: { on: true, price: "", dur: "20" }, home: { on: false, price: "", dur: "45" }, clinic: { on: false, price: "", dur: "30" } });
  const [days, setDays] = useState<Record<number, { on: boolean; from: string; to: string }>>(() => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { on: d >= 1 && d <= 5, from: "09:00", to: "18:00" }])));

  useEffect(() => { supabaseBrowser().auth.getSession().then(({ data }) => { if (data.session) setStep(1); }); }, []);

  async function account() {
    setBusy(true); setMsg("");
    try {
      if (login) { const { error } = await signInWithEmail(email, pass); if (error) throw error; setStep(1); }
      else {
        if (pass.length < 8) throw new Error(t.pass);
        const { data, error } = await signUpWithEmail(email, pass, name); if (error) throw error;
        if (data.session) { await supabaseBrowser().from("owners").upsert({ id: data.user!.id, full_name: name, country, language: lang }, { onConflict: "id", ignoreDuplicates: true }); setStep(1); }
        else setMsg(t.checkMail);
      }
    } catch (e) { setMsg(t.err + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  }

  async function save() {
    const chosen = (Object.keys(svc) as Svc[]).filter((k) => svc[k].on && Number(svc[k].price) > 0);
    if (!chosen.length) return setMsg(t.needSvc);
    const rules = [0, 1, 2, 3, 4, 5, 6].filter((d) => days[d].on && days[d].to > days[d].from);
    if (!rules.length) return setMsg(t.needHours);
    setBusy(true); setMsg("");
    try {
      const sb = supabaseBrowser();
      const { data: u } = await sb.auth.getUser(); const user = u.user; if (!user) throw new Error("not signed in");
      let id = practiceId;
      if (!id) {
        const slug = `${slugify(pname) || "vet"}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: p, error } = await sb.from("practices").insert({ owner_user_id: user.id, country, kind, name: pname, slug, headline: headline || null, address: address || null, postal_code: postal || null, phone: phone || null, email: user.email, timezone, languages: spoken, published: false }).select("id").single();
        if (error) throw error; id = p.id; setPracticeId(id);
        const { data: pr, error: e2 } = await sb.from("practitioners").insert({ practice_id: id, user_id: user.id, display_name: pname }).select("id").single();
        if (e2) throw e2;
        const { error: e3 } = await sb.from("services").insert(chosen.map((k) => ({ practice_id: id, practitioner_id: pr.id, type: k, catalog_code: CATALOG[k], duration_min: Math.min(240, Math.max(5, Number(svc[k].dur) || 30)), price_cents: ZERO_DECIMAL.has(currency) ? Math.round(Number(svc[k].price)) : Math.round(Number(svc[k].price) * 100), currency, active: true })));
        if (e3) throw e3;
        const { error: e4 } = await sb.from("opening_rules").insert(rules.map((d) => ({ practitioner_id: pr.id, weekday: d, start_time: days[d].from, end_time: days[d].to, slot_min: 30 })));
        if (e4) throw e4;
      }
      setStep(3);
    } catch (e) { setMsg(t.err + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  }

  async function pay() {
    setBusy(true);
    const { data } = await supabaseBrowser().auth.getSession();
    const r = await fetch(`/api/connect/${provider}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token}` }, body: JSON.stringify({ practiceId }) });
    const j = await r.json(); setBusy(false);
    if (j.url) window.location.href = j.url; else setMsg(t.err + (j.error ?? r.status));
  }

  const here = `/${lang}/${country.toLowerCase()}/pro/inscription`;
  return (
    <div>
      <h1>{t.title}</h1>
      {step === 0 && <section>
        <h2>{t.account}</h2>
        <button style={ghost} onClick={() => signInWithProvider("google", here)}>{t.google}</button>
        {!login && <><label style={label}>{t.name}</label><input style={inp} value={name} onChange={(e) => setName(e.target.value)} /></>}
        <label style={label}>{t.email}</label><input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label style={label}>{t.pass}</label><input style={inp} type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <p><button style={btn} disabled={busy || !email || !pass || (!login && !name)} onClick={account}>{login ? t.login : t.create}</button>{" "}
          <button style={{ ...ghost, border: 0 }} onClick={() => { setLogin(!login); setMsg(""); }}>{login ? t.create : t.have}</button></p>
      </section>}
      {step === 1 && <section>
        <h2>{t.prac}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(Object.keys(t.kind) as Kind[]).map((k) => <button key={k} style={kind === k ? btn : ghost} onClick={() => { setKind(k); setSvc({ ...svc, home: { ...svc.home, on: k === "home" || svc.home.on }, clinic: { ...svc.clinic, on: k === "clinic" || svc.clinic.on } }); }}>{t.kind[k]}</button>)}</div>
        <label style={label}>{t.pname}</label><input style={inp} value={pname} onChange={(e) => setPname(e.target.value)} />
        <label style={label}>{t.headline}</label><input style={inp} value={headline} maxLength={140} onChange={(e) => setHeadline(e.target.value)} />
        <label style={label}>{t.address}</label><input style={inp} value={address} onChange={(e) => setAddress(e.target.value)} />
        <label style={label}>{t.postal}</label><input style={inp} value={postal} onChange={(e) => setPostal(e.target.value)} />
        <label style={label}>{t.phone}</label><input style={inp} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label style={label}>{t.langs}</label>
        {languages.map((l) => <label key={l} style={{ marginRight: 14 }}><input type="checkbox" checked={spoken.includes(l)} onChange={(e) => setSpoken(e.target.checked ? [...spoken, l] : spoken.filter((x) => x !== l))} /> {new Intl.DisplayNames([lang], { type: "language" }).of(l)}</label>)}
        <p><button style={btn} disabled={!pname.trim() || !spoken.length} onClick={() => setStep(2)}>{t.next}</button></p>
      </section>}
      {step === 2 && <section>
        <h2>{t.svcs}</h2>
        {(Object.keys(svc) as Svc[]).map((k) => <div key={k} style={{ border: "1px solid #e3e8f4", borderRadius: 12, padding: 12, margin: "10px 0" }}>
          <label><input type="checkbox" checked={svc[k].on} onChange={(e) => setSvc({ ...svc, [k]: { ...svc[k], on: e.target.checked } })} /> <strong>{t.svcName[k]}</strong></label>
          {svc[k].on && <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1 }}><small>{t.price} ({currency})</small><input style={inp} inputMode="decimal" value={svc[k].price} onChange={(e) => setSvc({ ...svc, [k]: { ...svc[k], price: e.target.value.replace(",", ".") } })} /></div>
            <div style={{ flex: 1 }}><small>{t.dur}</small><input style={inp} inputMode="numeric" value={svc[k].dur} onChange={(e) => setSvc({ ...svc, [k]: { ...svc[k], dur: e.target.value } })} /></div></div>}
        </div>)}
        <h2>{t.hours}</h2>
        {[1, 2, 3, 4, 5, 6, 0].map((d) => <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
          <label style={{ width: 70 }}><input type="checkbox" checked={days[d].on} onChange={(e) => setDays({ ...days, [d]: { ...days[d], on: e.target.checked } })} /> {t.days[d]}</label>
          {days[d].on && <>{t.from} <input type="time" value={days[d].from} onChange={(e) => setDays({ ...days, [d]: { ...days[d], from: e.target.value } })} /> {t.to} <input type="time" value={days[d].to} onChange={(e) => setDays({ ...days, [d]: { ...days[d], to: e.target.value } })} /></>}
        </div>)}
        <p><button style={ghost} onClick={() => setStep(1)}>{t.back}</button>{" "}<button style={btn} disabled={busy} onClick={save}>{busy ? t.saving : t.save}</button></p>
      </section>}
      {step === 3 && <section>
        <h2>{t.doneT}</h2><p>{t.done}</p>
        <p><button style={btn} disabled={busy} onClick={pay}>{t.pay}</button>{" "}<a href={`/${lang}/${country.toLowerCase()}/`}>{t.home}</a></p>
      </section>}
      {msg && <p role="alert" style={{ color: msg.startsWith(t.err) ? "#b00020" : "#14213d" }}>{msg}</p>}
    </div>
  );
}
