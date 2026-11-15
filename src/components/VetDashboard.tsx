"use client";
import { useCallback, useEffect, useState } from "react";
import { signInWithEmail, signInWithProvider, signOut, supabaseBrowser } from "@/lib/auth-client";
import { ZERO_DECIMAL } from "@/lib/countries";

/** Vet space: agenda (bookings), profile, services, opening hours, payments & calendar link. Writes go through RLS; protected fields are guarded in the DB (migration 0007). */
type Tab = "agenda" | "profile" | "services" | "hours" | "pay";
type Booking = { id: string; starts_at: string; ends_at: string; type: string; status: string; address: string | null; motive: string | null; access_notes: string | null; price_cents: number; currency: string; payment_status: string; video_room: string | null;
  owners: { full_name: string; phone: string | null } | null; pets: { name: string; species: string } | null; services: { custom_name: string | null } | null };
type Practice = { id: string; name: string; headline: string | null; about: string | null; address: string | null; postal_code: string | null; phone: string | null; languages: string[]; auto_confirm: boolean; published: boolean; stripe_status: string; mp_status: string; timezone: string };
type Service = { id: string; type: string; custom_name: string | null; duration_min: number; price_cents: number; currency: string; active: boolean };
type Rule = { weekday: number; start_time: string; end_time: string };

const T = {
  fr: { login: "Espace vétérinaire", email: "E-mail", pass: "Mot de passe", signin: "Me connecter", google: "Continuer avec Google", noPractice: "Aucun profil trouvé pour ce compte.", create: "Créer mon profil", tabs: { agenda: "Rendez-vous", profile: "Profil", services: "Consultations", hours: "Horaires", pay: "Paiements" },
    pending: "À confirmer", upcoming: "À venir", past: "Passés", none: "Rien pour le moment.", accept: "Accepter", decline: "Refuser", reason: "Message au propriétaire (facultatif)", join: "Ouvrir la visio", status: { pending: "À confirmer", confirmed: "Confirmé", declined: "Refusé", cancelled: "Annulé" }, types: { video: "Visio", home: "Domicile", clinic: "Clinique", expertise: "Avis d'expert" },
    live: "Votre profil est en ligne.", review: "Votre profil est en cours de vérification par l'équipe Televet.", auto: "Confirmer automatiquement les rendez-vous", autoHelp: "Activé : un rendez-vous payé est confirmé tout de suite. Désactivé : vous acceptez ou refusez chaque demande.",
    name: "Nom affiché", headline: "Phrase de présentation", about: "À propos", address: "Adresse", postal: "Code postal", phone: "Téléphone", langs: "Langues parlées", save: "Enregistrer", saved: "Enregistré", price: "Prix", dur: "Durée (min)", active: "Actif", days: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"], from: "de", to: "à",
    pstate: { none: "Non connecté", onboarding: "En cours", verifying: "En vérification", active: "Actif", restricted: "Restreint", revoked: "Révoqué" }, connect: "Connecter mes paiements", cal: "Votre agenda Televet (à ajouter à Google Agenda, Apple Calendar…)", calHelp: "Copiez ce lien et ajoutez-le comme « agenda par URL ». Vos rendez-vous Televet y apparaissent.", out: "Se déconnecter", err: "Un problème est survenu : " },
  it: { login: "Area veterinari", email: "E-mail", pass: "Password", signin: "Accedi", google: "Continua con Google", noPractice: "Nessun profilo trovato per questo account.", create: "Crea il mio profilo", tabs: { agenda: "Appuntamenti", profile: "Profilo", services: "Visite", hours: "Orari", pay: "Pagamenti" },
    pending: "Da confermare", upcoming: "In arrivo", past: "Passati", none: "Per ora niente.", accept: "Accetta", decline: "Rifiuta", reason: "Messaggio al proprietario (facoltativo)", join: "Apri il video", status: { pending: "Da confermare", confirmed: "Confermato", declined: "Rifiutato", cancelled: "Annullato" }, types: { video: "Video", home: "Domicilio", clinic: "Clinica", expertise: "Parere esperto" },
    live: "Il tuo profilo è online.", review: "Il tuo profilo è in verifica da parte del team Televet.", auto: "Conferma automaticamente gli appuntamenti", autoHelp: "Attivo: un appuntamento pagato viene confermato subito. Disattivo: accetti o rifiuti ogni richiesta.",
    name: "Nome visualizzato", headline: "Frase di presentazione", about: "Chi sono", address: "Indirizzo", postal: "CAP", phone: "Telefono", langs: "Lingue parlate", save: "Salva", saved: "Salvato", price: "Prezzo", dur: "Durata (min)", active: "Attiva", days: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"], from: "dalle", to: "alle",
    pstate: { none: "Non collegato", onboarding: "In corso", verifying: "In verifica", active: "Attivo", restricted: "Limitato", revoked: "Revocato" }, connect: "Collega i pagamenti", cal: "La tua agenda Televet (da aggiungere a Google Calendar, Apple Calendar…)", calHelp: "Copia il link e aggiungilo come « calendario da URL ». Gli appuntamenti Televet compaiono lì.", out: "Esci", err: "Si è verificato un problema: " },
  en: { login: "Vet space", email: "E-mail", pass: "Password", signin: "Sign in", google: "Continue with Google", noPractice: "No profile found for this account.", create: "Create my profile", tabs: { agenda: "Appointments", profile: "Profile", services: "Consultations", hours: "Hours", pay: "Payments" },
    pending: "To confirm", upcoming: "Upcoming", past: "Past", none: "Nothing yet.", accept: "Accept", decline: "Decline", reason: "Message to the owner (optional)", join: "Open the video room", status: { pending: "To confirm", confirmed: "Confirmed", declined: "Declined", cancelled: "Cancelled" }, types: { video: "Video", home: "Home", clinic: "Clinic", expertise: "Expert opinion" },
    live: "Your profile is online.", review: "Your profile is being checked by the Televet team.", auto: "Confirm appointments automatically", autoHelp: "On: a paid appointment is confirmed right away. Off: you accept or decline each request.",
    name: "Display name", headline: "Introduction", about: "About", address: "Address", postal: "Postal code", phone: "Phone", langs: "Languages spoken", save: "Save", saved: "Saved", price: "Price", dur: "Duration (min)", active: "Active", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], from: "from", to: "to",
    pstate: { none: "Not connected", onboarding: "In progress", verifying: "Being verified", active: "Active", restricted: "Restricted", revoked: "Revoked" }, connect: "Connect my payments", cal: "Your Televet calendar (add to Google Calendar, Apple Calendar…)", calHelp: "Copy this link and add it as a “calendar from URL”. Your Televet appointments show up there.", out: "Sign out", err: "Something went wrong: " },
  es: { login: "Espacio veterinarios", email: "E-mail", pass: "Contraseña", signin: "Entrar", google: "Continuar con Google", noPractice: "No hay perfil para esta cuenta.", create: "Crear mi perfil", tabs: { agenda: "Citas", profile: "Perfil", services: "Consultas", hours: "Horarios", pay: "Pagos" },
    pending: "Por confirmar", upcoming: "Próximas", past: "Pasadas", none: "Nada por ahora.", accept: "Aceptar", decline: "Rechazar", reason: "Mensaje al propietario (opcional)", join: "Abrir la videollamada", status: { pending: "Por confirmar", confirmed: "Confirmada", declined: "Rechazada", cancelled: "Cancelada" }, types: { video: "Video", home: "Domicilio", clinic: "Clínica", expertise: "Opinión experta" },
    live: "Tu perfil está en línea.", review: "Tu perfil está siendo revisado por el equipo de Televet.", auto: "Confirmar las citas automáticamente", autoHelp: "Activado: una cita pagada se confirma al instante. Desactivado: aceptas o rechazas cada solicitud.",
    name: "Nombre visible", headline: "Frase de presentación", about: "Sobre mí", address: "Dirección", postal: "Código postal", phone: "Teléfono", langs: "Idiomas", save: "Guardar", saved: "Guardado", price: "Precio", dur: "Duración (min)", active: "Activa", days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"], from: "de", to: "a",
    pstate: { none: "No conectado", onboarding: "En curso", verifying: "En verificación", active: "Activo", restricted: "Restringido", revoked: "Revocado" }, connect: "Conectar mis pagos", cal: "Tu agenda de Televet (para añadir a Google Calendar, Apple Calendar…)", calHelp: "Copia el enlace y añádelo como « calendario por URL ». Tus citas de Televet aparecen ahí.", out: "Salir", err: "Hubo un problema: " },
  pl: { login: "Strefa weterynarza", email: "E-mail", pass: "Hasło", signin: "Zaloguj się", google: "Kontynuuj z Google", noPractice: "Brak profilu dla tego konta.", create: "Załóż profil", tabs: { agenda: "Wizyty", profile: "Profil", services: "Konsultacje", hours: "Godziny", pay: "Płatności" },
    pending: "Do potwierdzenia", upcoming: "Nadchodzące", past: "Minione", none: "Na razie nic.", accept: "Przyjmij", decline: "Odrzuć", reason: "Wiadomość do właściciela (opcjonalnie)", join: "Otwórz wideorozmowę", status: { pending: "Do potwierdzenia", confirmed: "Potwierdzona", declined: "Odrzucona", cancelled: "Anulowana" }, types: { video: "Wideo", home: "Dom", clinic: "Klinika", expertise: "Opinia eksperta" },
    live: "Twój profil jest online.", review: "Zespół Televet sprawdza Twój profil.", auto: "Potwierdzaj wizyty automatycznie", autoHelp: "Włączone: opłacona wizyta jest potwierdzana od razu. Wyłączone: każdą prośbę przyjmujesz lub odrzucasz.",
    name: "Wyświetlana nazwa", headline: "Jedno zdanie o Tobie", about: "O mnie", address: "Adres", postal: "Kod pocztowy", phone: "Telefon", langs: "Języki", save: "Zapisz", saved: "Zapisano", price: "Cena", dur: "Czas (min)", active: "Aktywna", days: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"], from: "od", to: "do",
    pstate: { none: "Niepołączone", onboarding: "W toku", verifying: "Weryfikacja", active: "Aktywne", restricted: "Ograniczone", revoked: "Cofnięte" }, connect: "Połącz płatności", cal: "Twój kalendarz Televet (dodaj do Kalendarza Google, Apple…)", calHelp: "Skopiuj link i dodaj go jako „kalendarz z adresu URL”. Wizyty z Televet pojawią się tam.", out: "Wyloguj", err: "Wystąpił problem: " },
} as const;

const inp = { width: "100%", padding: 10, border: "1px solid #c9d2e6", borderRadius: 8, font: "inherit", boxSizing: "border-box" } as const;
const btn = { background: "#0b3bbf", color: "#fff", fontWeight: 700, padding: "10px 18px", borderRadius: 10, border: 0, cursor: "pointer", font: "inherit" } as const;
const ghost = { background: "#fff", color: "#0b3bbf", border: "1px solid #0b3bbf", fontWeight: 600, padding: "8px 14px", borderRadius: 10, cursor: "pointer", font: "inherit" } as const;
const lab = { display: "block", margin: "12px 0 4px", fontWeight: 600 } as const;
const card = { border: "1px solid #e3e8f4", borderRadius: 12, padding: 14, margin: "10px 0" } as const;

export default function VetDashboard({ lang, country, currency, languages, provider }: { lang: string; country: string; currency: string; languages: string[]; provider: "stripe" | "mercadopago" }) {
  const t = (T[lang as keyof typeof T] ?? T.en) as (typeof T)["en"];
  const sb = supabaseBrowser();
  const [ready, setReady] = useState(false), [signed, setSigned] = useState(false), [tab, setTab] = useState<Tab>("agenda"), [msg, setMsg] = useState("");
  const [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [p, setP] = useState<Practice | null>(null), [bookings, setBookings] = useState<Booking[]>([]), [svcs, setSvcs] = useState<Service[]>([]), [rules, setRules] = useState<Rule[]>([]), [pract, setPract] = useState(""), [feed, setFeed] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null), [reply, setReply] = useState("");
  const token = async () => (await sb.auth.getSession()).data.session?.access_token ?? "";
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const load = useCallback(async () => {
    const { data: s } = await sb.auth.getSession();
    setSigned(!!s.session); if (!s.session) return setReady(true);
    const { data: pr } = await sb.from("practices").select("id, name, headline, about, address, postal_code, phone, languages, auto_confirm, published, stripe_status, mp_status, timezone").eq("owner_user_id", s.session.user.id).maybeSingle();
    setP(pr as Practice | null);
    if (pr) {
      const { data: pt } = await sb.from("practitioners").select("id").eq("practice_id", pr.id).limit(1).maybeSingle();
      setPract(pt?.id ?? "");
      const [{ data: sv }, { data: ru }, { data: fd }] = await Promise.all([
        sb.from("services").select("id, type, custom_name, duration_min, price_cents, currency, active").eq("practice_id", pr.id),
        pt ? sb.from("opening_rules").select("weekday, start_time, end_time").eq("practitioner_id", pt.id) : Promise.resolve({ data: [] as Rule[] }),
        pt ? sb.from("ical_feeds").select("token").eq("practitioner_id", pt.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setSvcs((sv as Service[]) ?? []); setRules((ru as Rule[]) ?? []); setFeed(fd?.token ? `${window.location.origin}/api/ical/${fd.token}` : "");
      const r = await fetch("/api/pro/bookings", { headers: { authorization: `Bearer ${s.session.access_token}` } });
      setBookings(r.ok ? (await r.json()).bookings : []);
    }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const money = (c: number, cur: string) => new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? c : c / 100);
  const when = (iso: string) => new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: p?.timezone }).format(new Date(iso));

  async function act(id: string, what: "confirm" | "decline") {
    const r = await fetch(`/api/bookings/${id}/${what}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: JSON.stringify({ reply: what === "decline" ? reply : undefined }) });
    if (!r.ok) flash(t.err + ((await r.json().catch(() => ({}))).error ?? r.status)); else { setReplyFor(null); setReply(""); await load(); }
  }
  async function saveProfile() {
    if (!p) return;
    const { error } = await sb.from("practices").update({ name: p.name, headline: p.headline, about: p.about, address: p.address, postal_code: p.postal_code, phone: p.phone, languages: p.languages, auto_confirm: p.auto_confirm }).eq("id", p.id);
    flash(error ? t.err + error.message : t.saved);
  }
  async function saveService(s: Service) {
    const { error } = await sb.from("services").update({ price_cents: s.price_cents, duration_min: Math.min(240, Math.max(5, s.duration_min)), active: s.active }).eq("id", s.id);
    flash(error ? t.err + error.message : t.saved);
  }
  async function saveHours() {
    if (!pract) return;
    const del = await sb.from("opening_rules").delete().eq("practitioner_id", pract); if (del.error) return flash(t.err + del.error.message);
    const rows = rules.filter((r) => r.end_time > r.start_time).map((r) => ({ practitioner_id: pract, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, slot_min: 30 }));
    const ins = rows.length ? await sb.from("opening_rules").insert(rows) : { error: null };
    flash(ins.error ? t.err + ins.error.message : t.saved);
  }
  async function connect() {
    const r = await fetch(`/api/connect/${provider}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: JSON.stringify({ practiceId: p!.id }) });
    const j = await r.json(); if (j.url) window.location.href = j.url; else flash(t.err + (j.error ?? r.status));
  }

  if (!ready) return <p>…</p>;
  if (!signed) return <section><h1>{t.login}</h1>
    <button style={ghost} onClick={() => signInWithProvider("google", window.location.pathname)}>{t.google}</button>
    <label style={lab}>{t.email}</label><input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <label style={lab}>{t.pass}</label><input style={inp} type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
    <p><button style={btn} onClick={async () => { const { error } = await signInWithEmail(email, pass); if (error) flash(t.err + error.message); else load(); }}>{t.signin}</button></p>
    {msg && <p role="alert" style={{ color: "#b00020" }}>{msg}</p>}</section>;
  if (!p) return <section><h1>{t.login}</h1><p>{t.noPractice}</p><p><a href={`/${lang}/${country.toLowerCase()}/pro/inscription`}>{t.create}</a></p></section>;

  const now = Date.now();
  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.ends_at).getTime() >= now);
  const past = bookings.filter((b) => !pending.includes(b) && !upcoming.includes(b)).reverse();
  const row = (b: Booking, actions: boolean) => <div key={b.id} style={card}>
    <strong>{when(b.starts_at)}</strong> · {t.types[b.type as keyof typeof t.types] ?? b.type} · {money(b.price_cents, b.currency)} · <em>{t.status[b.status as keyof typeof t.status] ?? b.status}</em>
    <div>{b.owners?.full_name}{b.owners?.phone ? ` · ${b.owners.phone}` : ""} — {b.pets?.name}{b.pets?.species ? ` (${b.pets.species})` : ""}</div>
    {b.motive && <div style={{ color: "#4a5568" }}>{b.motive}</div>}
    {b.address && <div style={{ color: "#4a5568" }}>{b.address}{b.access_notes ? ` · ${b.access_notes}` : ""}</div>}
    {b.status === "confirmed" && b.video_room && b.type === "video" && <div><a href={`/visio/${b.id}`}>{t.join}</a></div>}
    {actions && <div style={{ marginTop: 8 }}>
      {replyFor === b.id && <input style={{ ...inp, marginBottom: 8 }} placeholder={t.reason} value={reply} onChange={(e) => setReply(e.target.value)} />}
      <button style={btn} onClick={() => act(b.id, "confirm")}>{t.accept}</button>{" "}
      <button style={ghost} onClick={() => (replyFor === b.id ? act(b.id, "decline") : setReplyFor(b.id))}>{t.decline}</button></div>}
  </div>;
  const pState = provider === "stripe" ? p.stripe_status : p.mp_status;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0 }}>{p.name}</h1><button style={{ ...ghost, border: 0 }} onClick={async () => { await signOut(); setSigned(false); }}>{t.out}</button></div>
      <p>{p.published ? t.live : t.review}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>{(Object.keys(t.tabs) as Tab[]).map((k) => <button key={k} style={tab === k ? btn : ghost} onClick={() => setTab(k)}>{t.tabs[k]}{k === "agenda" && pending.length ? ` (${pending.length})` : ""}</button>)}</div>
      {msg && <p role="alert" style={{ color: msg.startsWith(t.err) ? "#b00020" : "#0a7a3b" }}>{msg}</p>}

      {tab === "agenda" && <section>
        {pending.length > 0 && <><h2>{t.pending}</h2>{pending.map((b) => row(b, true))}</>}
        <h2>{t.upcoming}</h2>{upcoming.length ? upcoming.map((b) => row(b, false)) : <p>{t.none}</p>}
        {past.length > 0 && <><h2>{t.past}</h2>{past.slice(0, 30).map((b) => row(b, false))}</>}</section>}

      {tab === "profile" && <section>
        <label style={{ display: "block", margin: "12px 0" }}><input type="checkbox" checked={p.auto_confirm} onChange={(e) => setP({ ...p, auto_confirm: e.target.checked })} /> <strong>{t.auto}</strong><br /><small>{t.autoHelp}</small></label>
        {([["name", t.name], ["headline", t.headline], ["address", t.address], ["postal_code", t.postal], ["phone", t.phone]] as const).map(([k, l]) => <div key={k}><label style={lab}>{l}</label><input style={inp} value={(p[k] as string | null) ?? ""} onChange={(e) => setP({ ...p, [k]: e.target.value })} /></div>)}
        <label style={lab}>{t.about}</label><textarea style={{ ...inp, minHeight: 100 }} value={p.about ?? ""} onChange={(e) => setP({ ...p, about: e.target.value })} />
        <label style={lab}>{t.langs}</label>{languages.map((l) => <label key={l} style={{ marginRight: 14 }}><input type="checkbox" checked={p.languages.includes(l)} onChange={(e) => setP({ ...p, languages: e.target.checked ? [...p.languages, l] : p.languages.filter((x) => x !== l) })} /> {new Intl.DisplayNames([lang], { type: "language" }).of(l)}</label>)}
        <p><button style={btn} onClick={saveProfile}>{t.save}</button></p></section>}

      {tab === "services" && <section>{svcs.map((s, i) => <div key={s.id} style={card}>
        <strong>{s.custom_name ?? t.types[s.type as keyof typeof t.types] ?? s.type}</strong>
        <div style={{ display: "flex", gap: 10, margin: "8px 0", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120 }}><small>{t.price} ({s.currency})</small><input style={inp} inputMode="decimal" value={ZERO_DECIMAL.has(s.currency) ? s.price_cents : s.price_cents / 100} onChange={(e) => { const v = Number(e.target.value.replace(",", ".")) || 0; setSvcs(svcs.map((x, j) => (j === i ? { ...x, price_cents: ZERO_DECIMAL.has(s.currency) ? Math.round(v) : Math.round(v * 100) } : x))); }} /></div>
          <div style={{ flex: 1, minWidth: 120 }}><small>{t.dur}</small><input style={inp} inputMode="numeric" value={s.duration_min} onChange={(e) => setSvcs(svcs.map((x, j) => (j === i ? { ...x, duration_min: Number(e.target.value) || 0 } : x)))} /></div></div>
        <label><input type="checkbox" checked={s.active} onChange={(e) => setSvcs(svcs.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} /> {t.active}</label>{" "}
        <button style={btn} onClick={() => saveService(s)}>{t.save}</button></div>)}</section>}

      {tab === "hours" && <section>{[1, 2, 3, 4, 5, 6, 0].map((d) => { const r = rules.find((x) => x.weekday === d); return <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <label style={{ width: 70 }}><input type="checkbox" checked={!!r} onChange={(e) => setRules(e.target.checked ? [...rules, { weekday: d, start_time: "09:00", end_time: "18:00" }] : rules.filter((x) => x.weekday !== d))} /> {t.days[d]}</label>
        {r && <>{t.from} <input type="time" value={r.start_time.slice(0, 5)} onChange={(e) => setRules(rules.map((x) => (x.weekday === d ? { ...x, start_time: e.target.value } : x)))} /> {t.to} <input type="time" value={r.end_time.slice(0, 5)} onChange={(e) => setRules(rules.map((x) => (x.weekday === d ? { ...x, end_time: e.target.value } : x)))} /></>}</div>; })}
        <p><button style={btn} onClick={saveHours}>{t.save}</button></p></section>}

      {tab === "pay" && <section>
        <p><strong>{provider === "stripe" ? "Stripe" : "Mercado Pago"}:</strong> {t.pstate[pState as keyof typeof t.pstate] ?? pState}</p>
        {pState !== "active" && <p><button style={btn} onClick={connect}>{t.connect}</button></p>}
        {feed && <><h2>{t.cal}</h2><p>{t.calHelp}</p><input style={inp} readOnly value={feed} onFocus={(e) => e.currentTarget.select()} /></>}</section>}
    </div>
  );
}
