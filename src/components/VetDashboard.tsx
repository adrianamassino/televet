"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CalendarCheck, CalendarDays, Clock, Hospital, Settings, Stethoscope, Users } from "lucide-react";
import { signInWithEmail, signInWithProvider, signOut, supabaseBrowser } from "@/lib/auth-client";
import { ZERO_DECIMAL } from "@/lib/countries";
import { VI } from "@/components/VI";
import { pc } from "@/lib/profile-copy";
import { zonedToUtc, addDays } from "@/lib/time";

/**
 * Vet space — same features as the old app.televet.co: clinic profile, vets (photo, public info, hours, consultations,
 * days off, video-room link), online-booking page (URL, title, on/off), calendar links (Google, Vetup, VetIt, Petbooqz),
 * Stripe / Mercado Pago, e-mail reminders — plus the appointment list. Writes go through RLS; protected fields are guarded in the DB.
 */
const LANGS = ["fr", "it", "en", "es", "pl"] as const;
// each entry: [fr, it, en, es, pl]
const S: Record<string, [string, string, string, string, string]> = {
  title: ["Espace vétérinaire", "Area veterinari", "Vet space", "Espacio veterinarios", "Strefa weterynarza"],
  email: ["E-mail", "E-mail", "E-mail", "E-mail", "E-mail"], pass: ["Mot de passe", "Password", "Password", "Contraseña", "Hasło"],
  signin: ["Me connecter", "Accedi", "Sign in", "Entrar", "Zaloguj się"], google: ["Continuer avec Google", "Continua con Google", "Continue with Google", "Continuar con Google", "Kontynuuj z Google"],
  noPractice: ["Aucun profil pour ce compte.", "Nessun profilo per questo account.", "No profile for this account.", "No hay perfil para esta cuenta.", "Brak profilu dla tego konta."],
  create: ["Créer mon profil", "Crea il mio profilo", "Create my profile", "Crear mi perfil", "Załóż profil"],
  nAgenda: ["Rendez-vous", "Appuntamenti", "Appointments", "Citas", "Wizyty"], nClinic: ["Clinique", "Clinica", "Clinic", "Clínica", "Klinika"], nVets: ["Vétérinaires", "Veterinari", "Vets", "Veterinarios", "Weterynarze"],
  nSettings: ["Paramètres", "Impostazioni", "Settings", "Ajustes", "Ustawienia"], nReminders: ["Rappels", "Promemoria", "Reminders", "Recordatorios", "Przypomnienia"], out: ["Se déconnecter", "Esci", "Sign out", "Salir", "Wyloguj"],
  pending: ["À confirmer", "Da confermare", "To confirm", "Por confirmar", "Do potwierdzenia"], upcoming: ["À venir", "In arrivo", "Upcoming", "Próximas", "Nadchodzące"], past: ["Passés", "Passati", "Past", "Pasadas", "Minione"],
  none: ["Rien pour le moment.", "Per ora niente.", "Nothing yet.", "Nada por ahora.", "Na razie nic."], accept: ["Accepter", "Accetta", "Accept", "Aceptar", "Przyjmij"], decline: ["Refuser", "Rifiuta", "Decline", "Rechazar", "Odrzuć"],
  reason: ["Message au propriétaire (facultatif)", "Messaggio al proprietario (facoltativo)", "Message to the owner (optional)", "Mensaje al propietario (opcional)", "Wiadomość do właściciela (opcjonalnie)"],
  join: ["Ouvrir la visio", "Apri il video", "Open the video room", "Abrir la videollamada", "Otwórz wideorozmowę"],
  s_pending: ["À confirmer", "Da confermare", "To confirm", "Por confirmar", "Do potwierdzenia"], s_confirmed: ["Confirmé", "Confermato", "Confirmed", "Confirmada", "Potwierdzona"], s_declined: ["Refusé", "Rifiutato", "Declined", "Rechazada", "Odrzucona"], s_cancelled: ["Annulé", "Annullato", "Cancelled", "Cancelada", "Anulowana"],
  t_video: ["Télémédecine", "Telemedicina", "Telemedicine", "Telemedicina", "Telemedycyna"], t_home: ["À domicile", "A domicilio", "Home visit", "A domicilio", "Wizyta domowa"], t_clinic: ["À la clinique", "In clinica", "At the clinic", "En la clínica", "W klinice"], t_expertise: ["Télé-expertise (vétérinaire à vétérinaire)", "Tele-expertise (da veterinario a veterinario)", "Tele-expertise (vet to vet)", "Teleexperticia (veterinario a veterinario)", "Teleekspertyza (weterynarz–weterynarz)"],
  live: ["Votre profil est en ligne.", "Il tuo profilo è online.", "Your profile is online.", "Tu perfil está en línea.", "Twój profil jest online."], review: ["Votre profil est en cours de vérification par l'équipe Televet.", "Il tuo profilo è in verifica da parte del team Televet.", "Your profile is being checked by the Televet team.", "Tu perfil está siendo revisado por el equipo de Televet.", "Zespół Televet sprawdza Twój profil."],
  city: ["Ville", "Città", "City", "Ciudad", "Miasto"], website: ["Site web", "Sito web", "Website", "Sitio web", "Strona www"],
  accessInfo: ["Comment venir (métro, bus, parking)", "Come arrivare (metro, bus, parcheggio)", "How to get there (metro, bus, parking)", "Cómo llegar (metro, bus, estacionamiento)", "Dojazd (metro, autobus, parking)"],
  facL: ["Équipements sur place", "Servizi in sede", "On-site facilities", "Servicios en el centro", "Udogodnienia na miejscu"], payL: ["Moyens de paiement", "Metodi di pagamento", "Payment methods", "Medios de pago", "Metody płatności"],
  animalsL: ["Animaux soignés", "Animali curati", "Animals treated", "Animales atendidos", "Leczone zwierzęta"], founded: ["Année de création", "Anno di fondazione", "Year founded", "Año de creación", "Rok założenia"],
  vTitle: ["Titre (Dr, Dre…)", "Titolo (Dott., Dott.ssa…)", "Title (Dr…)", "Título (Dr., Dra.…)", "Tytuł (dr…)"], vSpec: ["Spécialités (séparées par des virgules)", "Specialità (separate da virgole)", "Specialties (comma-separated)", "Especialidades (separadas por comas)", "Specjalizacje (po przecinku)"],
  vBio: ["Présentation", "Presentazione", "About you", "Presentación", "O Tobie"], vSchool: ["Formation (école, diplôme)", "Formazione (università, titolo)", "Training (school, degree)", "Formación (universidad, título)", "Wykształcenie"], vYears: ["Années d'expérience", "Anni di esperienza", "Years of experience", "Años de experiencia", "Lata doświadczenia"],
  pageLink: ["Voir ma page publique", "Vedi la mia pagina pubblica", "See my public page", "Ver mi página pública", "Zobacz moją stronę"],
  clinicProfile: ["Profil de la clinique", "Profilo della clinica", "Clinic profile", "Perfil de la clínica", "Profil kliniki"], photoHint: ["Cliquer pour changer", "Clicca per cambiare", "Click to change", "Clic para cambiar", "Kliknij, aby zmienić"],
  name: ["Nom affiché", "Nome visualizzato", "Display name", "Nombre visible", "Wyświetlana nazwa"], phone: ["Téléphone", "Telefono", "Phone", "Teléfono", "Telefon"], address: ["Adresse", "Indirizzo", "Address", "Dirección", "Adres"], postal: ["Code postal", "CAP", "Postal code", "Código postal", "Kod pocztowy"],
  tz: ["Fuseau horaire", "Fuso orario", "Time zone", "Zona horaria", "Strefa czasowa"], langs: ["Langues parlées", "Lingue parlate", "Languages spoken", "Idiomas", "Języki"], headline: ["Phrase de présentation", "Frase di presentazione", "Introduction", "Frase de presentación", "Jedno zdanie o Tobie"], about: ["À propos", "Chi siamo", "About", "Sobre nosotros", "O nas"],
  confirm: ["Confirmer", "Conferma", "Save", "Confirmar", "Zapisz"], saved: ["Enregistré", "Salvato", "Saved", "Guardado", "Zapisano"], err: ["Un problème est survenu : ", "Si è verificato un problema: ", "Something went wrong: ", "Hubo un problema: ", "Wystąpił problem: "],
  edit: ["Modifier", "Modifica", "Edit", "Editar", "Edytuj"], del: ["Supprimer", "Elimina", "Delete", "Eliminar", "Usuń"], add: ["Ajouter un vétérinaire", "Aggiungi un veterinario", "Add a vet", "Añadir un veterinario", "Dodaj weterynarza"], close: ["Fermer", "Chiudi", "Close", "Cerrar", "Zamknij"], back: ["Retour", "Indietro", "Back", "Atrás", "Wstecz"],
  askDel: ["Supprimer définitivement ? S'il a des rendez-vous, il sera seulement désactivé.", "Eliminare definitivamente? Se ha appuntamenti, verrà solo disattivato.", "Delete for good? If it has appointments it will only be deactivated.", "¿Eliminar definitivamente? Si tiene citas, solo se desactivará.", "Usunąć na stałe? Jeśli ma wizyty, zostanie tylko dezaktywowany."],
  mInfo: ["Informations publiques", "Informazioni pubbliche", "Public information", "Información pública", "Informacje publiczne"], mHours: ["Horaires de travail", "Orari di lavoro", "Working hours", "Horarios de trabajo", "Godziny pracy"], mServices: ["Consultations", "Visite", "Consultations", "Consultas", "Konsultacje"], mHolidays: ["Jours de congés", "Giorni di ferie", "Days off", "Días libres", "Dni wolne"], mVideo: ["Adresse de la salle de visioconférence", "Indirizzo della stanza video", "Video room address", "Dirección de la sala de video", "Adres pokoju wideo"], mCal: ["Agenda et logiciel de gestion", "Agenda e gestionale", "Agenda and practice software", "Agenda y software de gestión", "Kalendarz i oprogramowanie"],
  lead: ["Prochaine disponibilité (minutes)", "Prossima disponibilità (minuti)", "Next availability (minutes)", "Próxima disponibilidad (minutos)", "Najbliższy termin (minuty)"], photo: ["Photo", "Foto", "Photo", "Foto", "Zdjęcie"],
  days: ["Dim,Lun,Mar,Mer,Jeu,Ven,Sam", "Dom,Lun,Mar,Mer,Gio,Ven,Sab", "Sun,Mon,Tue,Wed,Thu,Fri,Sat", "Dom,Lun,Mar,Mié,Jue,Vie,Sáb", "Nd,Pn,Wt,Śr,Cz,Pt,Sb"], from: ["de", "dalle", "from", "de", "od"], to: ["à", "alle", "to", "a", "do"],
  newSvc: ["Nouvelle consultation", "Nuova visita", "New consultation", "Nueva consulta", "Nowa konsultacja"], svcName: ["Nom de la consultation", "Nome della visita", "Consultation name", "Nombre de la consulta", "Nazwa konsultacji"], desc: ["Description", "Descrizione", "Description", "Descripción", "Opis"], type: ["Type de consultation", "Tipo di visita", "Type of consultation", "Tipo de consulta", "Rodzaj konsultacji"],
  price: ["Prix", "Prezzo", "Price", "Precio", "Cena"], dur: ["Durée (min)", "Durata (min)", "Duration (min)", "Duración (min)", "Czas (min)"], daysOffered: ["Jours", "Giorni", "Days", "Días", "Dni"], payOnline: ["Paiement en ligne", "Pagamento online", "Online payment", "Pago online", "Płatność online"], active: ["Active", "Attiva", "Active", "Activa", "Aktywna"],
  confNote: ["Message personnalisé dans l'e-mail de confirmation (facultatif)", "Messaggio personalizzato nell'e-mail di conferma (facoltativo)", "Custom message in the confirmation e-mail (optional)", "Mensaje personalizado en el e-mail de confirmación (opcional)", "Własna wiadomość w e-mailu z potwierdzeniem (opcjonalnie)"],
  remNote: ["Message personnalisé dans l'e-mail de rappel (facultatif)", "Messaggio personalizzato nell'e-mail di promemoria (facoltativo)", "Custom message in the reminder e-mail (optional)", "Mensaje personalizado en el e-mail de recordatorio (opcional)", "Własna wiadomość w e-mailu z przypomnieniem (opcjonalnie)"],
  hStart: ["Début", "Inizio", "Start", "Inicio", "Początek"], hEnd: ["Fin", "Fine", "End", "Fin", "Koniec"], hReason: ["Motif (facultatif)", "Motivo (facoltativo)", "Reason (optional)", "Motivo (opcional)", "Powód (opcjonalnie)"], hAdd: ["Ajouter ces jours", "Aggiungi questi giorni", "Add these days", "Añadir estos días", "Dodaj te dni"], hNone: ["Aucun jour de congé à venir.", "Nessun giorno di ferie in programma.", "No upcoming days off.", "No hay días libres próximos.", "Brak zaplanowanych dni wolnych."],
  videoHelp: ["Laissez vide pour utiliser la visio intégrée de Televet. Sinon, collez ici votre lien (Zoom, Meet…).", "Lascia vuoto per usare il video integrato di Televet. Altrimenti incolla qui il tuo link (Zoom, Meet…).", "Leave empty to use Televet's built-in video. Otherwise paste your link here (Zoom, Meet…).", "Déjalo vacío para usar el video integrado de Televet. Si no, pega aquí tu enlace (Zoom, Meet…).", "Zostaw puste, aby użyć wideo Televet. Inaczej wklej tutaj swój link (Zoom, Meet…)."],
  setBooking: ["Réservations en ligne", "Prenotazioni online", "Online booking", "Reservas online", "Rezerwacje online"], url: ["URL", "URL", "URL", "URL", "URL"], bTitle: ["Titre", "Titolo", "Title", "Título", "Tytuł"], copy: ["Copier", "Copia", "Copy", "Copiar", "Kopiuj"], copied: ["Copié", "Copiato", "Copied", "Copiado", "Skopiowano"],
  bOn: ["Les réservations en ligne sont activées.", "Le prenotazioni online sono attive.", "Online booking is on.", "Las reservas online están activadas.", "Rezerwacje online są włączone."], bOff: ["Les réservations en ligne sont désactivées.", "Le prenotazioni online sono disattivate.", "Online booking is off.", "Las reservas online están desactivadas.", "Rezerwacje online są wyłączone."], turnOff: ["Désactiver", "Disattiva", "Turn off", "Desactivar", "Wyłącz"], turnOn: ["Activer", "Attiva", "Turn on", "Activar", "Włącz"],
  calendars: ["Agendas disponibles", "Agende disponibili", "Available calendars", "Calendarios disponibles", "Dostępne kalendarze"], calHelp: ["Connectez l'agenda de chaque vétérinaire : la nouvelle connexion remplace l'actuelle.", "Collega l'agenda di ogni veterinario: la nuova connessione sostituisce quella attuale.", "Connect each vet's calendar: a new connection replaces the current one.", "Conecta la agenda de cada veterinario: la nueva conexión reemplaza la actual.", "Połącz kalendarz każdego weterynarza: nowe połączenie zastępuje obecne."],
  token: ["Token fourni par le logiciel", "Token fornito dal gestionale", "Token from the software", "Token del software", "Token z oprogramowania"], activate: ["Activer la liaison", "Attiva il collegamento", "Activate the link", "Activar la vinculación", "Aktywuj połączenie"], disconnect: ["Déconnecter", "Scollega", "Disconnect", "Desconectar", "Rozłącz"], connected: ["Connecté", "Collegato", "Connected", "Conectado", "Połączono"], notConn: ["Non connecté", "Non collegato", "Not connected", "No conectado", "Niepołączone"],
  pimsNote: ["Le token est enregistré. La synchronisation avec ce logiciel démarre dès que l'intégration est activée par Televet.", "Il token è salvato. La sincronizzazione con questo gestionale parte appena Televet attiva l'integrazione.", "The token is saved. Syncing with this software starts as soon as Televet turns the integration on.", "El token está guardado. La sincronización con este software empieza cuando Televet active la integración.", "Token zapisany. Synchronizacja ruszy, gdy Televet włączy integrację."],
  feed: ["Lien iCal pour Google Agenda ou Apple Calendar", "Link iCal per Google Calendar o Apple Calendar", "iCal link for Google or Apple Calendar", "Enlace iCal para Google o Apple Calendar", "Link iCal dla Kalendarza Google lub Apple"], pay: ["Paiements en ligne", "Pagamenti online", "Online payments", "Pagos online", "Płatności online"], payState: ["État de la connexion", "Stato del collegamento", "Connection status", "Estado de la conexión", "Stan połączenia"], connectPay: ["Connecter mes paiements", "Collega i pagamenti", "Connect my payments", "Conectar mis pagos", "Połącz płatności"],
  auto: ["Confirmer automatiquement les rendez-vous", "Conferma automaticamente gli appuntamenti", "Confirm appointments automatically", "Confirmar las citas automáticamente", "Potwierdzaj wizyty automatycznie"], autoHelp: ["Activé : un rendez-vous payé est confirmé tout de suite. Désactivé : vous acceptez ou refusez chaque demande.", "Attivo: un appuntamento pagato viene confermato subito. Disattivo: accetti o rifiuti ogni richiesta.", "On: a paid appointment is confirmed right away. Off: you accept or decline each request.", "Activado: una cita pagada se confirma al instante. Desactivado: aceptas o rechazas cada solicitud.", "Włączone: opłacona wizyta jest potwierdzana od razu. Wyłączone: każdą prośbę przyjmujesz lub odrzucasz."],
  remTitle: ["E-mails de rappel aux propriétaires", "E-mail di promemoria ai proprietari", "Reminder e-mails to owners", "E-mails de recordatorio a los propietarios", "E-maile z przypomnieniem dla właścicieli"], rem24: ["Rappel 24 h avant le rendez-vous", "Promemoria 24 ore prima", "Reminder 24 h before", "Recordatorio 24 h antes", "Przypomnienie 24 h przed"], rem2: ["Rappel 2 h avant le rendez-vous", "Promemoria 2 ore prima", "Reminder 2 h before", "Recordatorio 2 h antes", "Przypomnienie 2 h przed"], emailLang: ["Langue des e-mails", "Lingua delle e-mail", "E-mail language", "Idioma de los e-mails", "Język e-maili"],
};

type Tab = "agenda" | "clinic" | "vets" | "settings" | "reminders";
type Sub = "menu" | "info" | "hours" | "services" | "holidays" | "video" | "cal";
type Booking = { id: string; starts_at: string; ends_at: string; type: string; status: string; address: string | null; motive: string | null; access_notes: string | null; price_cents: number; currency: string; video_room: string | null; owners: { full_name: string; phone: string | null } | null; pets: { name: string; species: string } | null };
type Practice = { id: string; slug: string; name: string; headline: string | null; about: string | null; address: string | null; postal_code: string | null; phone: string | null; email: string | null; languages: string[]; auto_confirm: boolean; published: boolean; stripe_status: string; mp_status: string; timezone: string; logo_url: string | null; booking_enabled: boolean; widget_title: string | null; email_language: string | null; reminders: { e24: boolean; e2: boolean }; city: string | null; website: string | null; founded_year: number | null; facilities: string[]; payment_methods: string[]; access_info: string | null; species: string[] };
type Vet = { id: string; display_name: string; photo_url: string | null; lead_time_min: number; video_link: string | null; active: boolean; slug: string | null; title: string | null; specialties: string[]; bio: string | null; languages: string[]; species: string[]; school: string | null; experience_years: number | null };
type Svc = { id: string; practitioner_id: string | null; type: string; custom_name: string | null; description: string | null; duration_min: number; price_cents: number; currency: string; active: boolean; online_payment: boolean; weekdays: number[]; confirmation_note: string | null; reminder_note: string | null; catalog_code: string };
type Rule = { weekday: number; start_time: string; end_time: string };
type Block = { id: string; starts_at: string; ends_at: string; reason: string | null };
type Conn = { practitioner_id: string; provider: string; status: string; last_error: string | null };
const CATALOG: Record<string, string> = { video: "video_consult", home: "home_visit", clinic: "clinic_visit", expertise: "tele_expertise" };
const PIMS = [["vetup", "Vetup"], ["vetit", "VetIt (UK)"], ["petbooqz", "Petbooqz"]] as const;
const initials = (n: string) => n.replace(/^(dr|dott|dra)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export default function VetDashboard({ lang, country, currency, languages, provider }: { lang: string; country: string; currency: string; languages: string[]; provider: "stripe" | "mercadopago" }) {
  const li = Math.max(0, (LANGS as readonly string[]).indexOf(lang)), en = LANGS.indexOf("en");
  const t = (k: string) => (S[k]?.[(LANGS as readonly string[]).includes(lang) ? li : en]) ?? k;
  const sb = useMemo(() => supabaseBrowser(), []);
  const PCt = pc(lang);
  const toggle = (arr: string[], k: string, on: boolean) => (on ? [...arr, k] : arr.filter((x) => x !== k));
  const Checks = ({ keys, labels, value, onChange }: { keys: string[]; labels: Record<string, string>; value: string[]; onChange: (v: string[]) => void }) => <div className="days">{keys.map((k) => <label key={k}><input type="checkbox" checked={value.includes(k)} onChange={(e) => onChange(toggle(value, k, e.target.checked))} />{labels[k] ?? k}</label>)}</div>;
  const slugOf = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const [ready, setReady] = useState(false), [signed, setSigned] = useState(false), [uid, setUid] = useState(""), [tab, setTab] = useState<Tab>("agenda"), [sub, setSub] = useState<Sub>("menu");
  const [toast, setToast] = useState<{ m: string; bad?: boolean } | null>(null), [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [p, setP] = useState<Practice | null>(null), [vets, setVets] = useState<Vet[]>([]), [vetId, setVetId] = useState<string>(""), [svcs, setSvcs] = useState<Svc[]>([]), [rules, setRules] = useState<Rule[]>([]), [blocks, setBlocks] = useState<Block[]>([]), [conns, setConns] = useState<Conn[]>([]), [feed, setFeed] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]), [replyFor, setReplyFor] = useState<string | null>(null), [reply, setReply] = useState("");
  const [editSvc, setEditSvc] = useState<Svc | null>(null), [hol, setHol] = useState({ from: "", to: "", reason: "" }), [tokens, setTokens] = useState<Record<string, string>>({});
  const flash = (m: string, bad = false) => { setToast({ m, bad }); setTimeout(() => setToast(null), 2600); };
  const fail = (e: { message: string } | null | undefined) => { if (e) flash(t("err") + e.message, true); return !!e; };
  const token = async () => (await sb.auth.getSession()).data.session?.access_token ?? "";
  const vet = vets.find((v) => v.id === vetId);
  const money = (c: number, cur: string) => new Intl.NumberFormat(lang, { style: "currency", currency: cur }).format(ZERO_DECIMAL.has(cur) ? c : c / 100);
  const when = (iso: string) => new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: p?.timezone }).format(new Date(iso));
  const dayNames = t("days").split(",");

  const load = useCallback(async () => {
    const { data: s } = await sb.auth.getSession();
    setSigned(!!s.session); if (!s.session) return setReady(true);
    setUid(s.session.user.id);
    const { data: pr } = await sb.from("practices").select("id, slug, name, headline, about, address, postal_code, phone, email, languages, auto_confirm, published, stripe_status, mp_status, timezone, logo_url, booking_enabled, widget_title, email_language, reminders, city, website, founded_year, facilities, payment_methods, access_info, species").eq("owner_user_id", s.session.user.id).maybeSingle();
    setP(pr as Practice | null);
    if (pr) {
      const { data: vs } = await sb.from("practitioners").select("id, display_name, photo_url, lead_time_min, video_link, active, slug, title, specialties, bio, languages, species, school, experience_years").eq("practice_id", pr.id).eq("active", true).order("display_name");
      setVets((vs as Vet[]) ?? []);
      const { data: sv } = await sb.from("services").select("id, practitioner_id, type, custom_name, description, duration_min, price_cents, currency, active, online_payment, weekdays, confirmation_note, reminder_note, catalog_code").eq("practice_id", pr.id);
      setSvcs((sv as Svc[]) ?? []);
      const ids = (vs ?? []).map((v) => v.id);
      if (ids.length) { const { data: cn } = await sb.from("calendar_connections").select("practitioner_id, provider, status, last_error").in("practitioner_id", ids); setConns((cn as Conn[]) ?? []); }
      const r = await fetch("/api/pro/bookings", { headers: { authorization: `Bearer ${s.session.access_token}` } });
      setBookings(r.ok ? (await r.json()).bookings : []);
    }
    setReady(true);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { // per-vet data
    if (!vetId) return;
    const today = new Date().toISOString();
    Promise.all([sb.from("opening_rules").select("weekday, start_time, end_time").eq("practitioner_id", vetId), sb.from("blocks").select("id, starts_at, ends_at, reason").eq("practitioner_id", vetId).gte("ends_at", today).order("starts_at"), sb.from("ical_feeds").select("token").eq("practitioner_id", vetId).maybeSingle()])
      .then(([r, b, f]) => { setRules((r.data as Rule[]) ?? []); setBlocks((b.data as Block[]) ?? []); setFeed(f.data?.token ? `${window.location.origin}/api/ical/${f.data.token}` : ""); });
  }, [vetId, sb]);

  async function upload(file: File): Promise<string | null> {
    const path = `${uid}/${crypto.randomUUID()}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
    const { error } = await sb.storage.from("avatars").upload(path, file, { contentType: file.type }); if (fail(error)) return null;
    return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }
  const act = async (id: string, what: "confirm" | "decline") => {
    const r = await fetch(`/api/bookings/${id}/${what}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: JSON.stringify({ reply: what === "decline" ? reply : undefined }) });
    if (!r.ok) flash(t("err") + ((await r.json().catch(() => ({}))).error ?? r.status), true); else { setReplyFor(null); setReply(""); load(); }
  };
  async function saveP(patch: Partial<Practice>) { if (!p) return; const next = { ...p, ...patch }; setP(next); const { id, slug: _s, published: _p, stripe_status: _a, mp_status: _b, ...cols } = next; void _s; void _p; void _a; void _b; if (!fail((await sb.from("practices").update(cols).eq("id", id)).error)) flash(t("saved")); }
  async function saveVet(patch: Partial<Vet>) { if (!vet) return; setVets(vets.map((v) => (v.id === vet.id ? { ...v, ...patch } : v))); if (!fail((await sb.from("practitioners").update(patch).eq("id", vet.id)).error)) flash(t("saved")); }
  async function addVet() { const { data, error } = await sb.from("practitioners").insert({ practice_id: p!.id, display_name: "Dr." }).select("id").single(); if (!fail(error)) { await load(); setVetId(data!.id); setSub("info"); } }
  async function delVet(v: Vet) {
    if (!confirm(t("askDel"))) return;
    const del = await sb.from("practitioners").delete().eq("id", v.id);
    if (del.error) { const off = await sb.from("practitioners").update({ active: false }).eq("id", v.id); if (fail(off.error)) return; }
    await load();
  }
  async function saveHours() {
    const d = await sb.from("opening_rules").delete().eq("practitioner_id", vetId); if (fail(d.error)) return;
    const rows = rules.filter((r) => r.end_time > r.start_time).map((r) => ({ practitioner_id: vetId, weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, slot_min: 30 }));
    if (rows.length && fail((await sb.from("opening_rules").insert(rows)).error)) return; flash(t("saved"));
  }
  async function saveSvc() {
    const s = editSvc!; const row = { practice_id: p!.id, practitioner_id: vetId, type: s.type, catalog_code: CATALOG[s.type] ?? "custom", custom_name: s.custom_name || null, description: s.description || null, duration_min: Math.min(240, Math.max(5, s.duration_min)), price_cents: s.price_cents, currency: s.currency, active: s.active, online_payment: s.online_payment, weekdays: s.weekdays, confirmation_note: s.confirmation_note || null, reminder_note: s.reminder_note || null };
    const res = s.id ? await sb.from("services").update(row).eq("id", s.id) : await sb.from("services").insert(row);
    if (!fail(res.error)) { setEditSvc(null); flash(t("saved")); load(); }
  }
  async function delSvc(s: Svc) { if (!confirm(t("askDel"))) return; const d = await sb.from("services").delete().eq("id", s.id); if (d.error) await sb.from("services").update({ active: false }).eq("id", s.id); setEditSvc(null); load(); }
  async function addHoliday() {
    if (!hol.from) return; const tz = p!.timezone, last = hol.to && hol.to >= hol.from ? hol.to : hol.from;
    const { error } = await sb.from("blocks").insert({ practitioner_id: vetId, starts_at: zonedToUtc(hol.from, "00:00", tz).toISOString(), ends_at: zonedToUtc(addDays(last, 1), "00:00", tz).toISOString(), reason: hol.reason || null });
    if (!fail(error)) { setHol({ from: "", to: "", reason: "" }); const { data } = await sb.from("blocks").select("id, starts_at, ends_at, reason").eq("practitioner_id", vetId).gte("ends_at", new Date().toISOString()).order("starts_at"); setBlocks((data as Block[]) ?? []); }
  }
  async function pims(call: "POST" | "DELETE", providerKey: string) {
    const r = await fetch("/api/pro/calendar", { method: call, headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: JSON.stringify({ practitionerId: vetId, provider: providerKey, token: call === "POST" ? tokens[providerKey] : undefined }) });
    if (!r.ok) flash(t("err") + ((await r.json().catch(() => ({}))).error ?? r.status), true); else { flash(t("saved")); load(); }
  }
  async function connect(url: string, body: object) { const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: JSON.stringify(body) }); const j = await r.json(); if (j.url) window.location.href = j.url; else flash(t("err") + (j.error ?? r.status), true); }

  if (!ready) return <div className="main">…</div>;
  if (!signed) return <div className="wrap narrow"><h1>{t("title")}</h1>
    <button className="btn btn-ghost" onClick={() => signInWithProvider("google", window.location.pathname)}>{t("google")}</button>
    <label className="label">{t("email")}</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <label className="label">{t("pass")}</label><input className="field" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
    <p style={{ marginTop: 18 }}><button className="btn" onClick={async () => { const { error } = await signInWithEmail(email, pass); if (!fail(error)) load(); }}>{t("signin")}</button></p>
    {toast && <div className={`toast${toast.bad ? " bad" : ""}`} role="alert">{toast.m}</div>}</div>;
  if (!p) return <div className="wrap narrow"><h1>{t("title")}</h1><p>{t("noPractice")}</p><p><a className="btn" href={`/${lang}/${country.toLowerCase()}/pro/inscription`}>{t("create")}</a></p></div>;

  const pending = bookings.filter((b) => b.status === "pending"), now = Date.now();
  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.ends_at).getTime() >= now), past = bookings.filter((b) => !pending.includes(b) && !upcoming.includes(b)).reverse();
  const bookUrl = `${typeof window === "undefined" ? "" : window.location.origin}/${lang}/${country.toLowerCase()}/reserver/${p.slug}`;
  const payState = provider === "stripe" ? p.stripe_status : p.mp_status;
  const Avatar = ({ src, name }: { src: string | null; name: string }) => (src ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="avatar" src={src} alt="" /> : <span className="avatar" aria-hidden>{initials(name)}</span>);
  const PhotoPick = ({ src, name, onFile }: { src: string | null; name: string; onFile: (u: string) => void }) => (
    <label style={{ display: "inline-grid", justifyItems: "center", gap: 6, cursor: "pointer" }}><Avatar src={src} name={name} /><small>{t("photoHint")}</small>
      <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await upload(f); if (u) onFile(u); } }} /></label>);
  const row = (b: Booking, actions: boolean) => <div key={b.id} className="panel">
    <strong>{when(b.starts_at)}</strong> <span className={`chip ${b.status === "confirmed" ? "ok" : b.status === "pending" ? "wait" : ""}`}>{t("s_" + b.status)}</span>
    <div>{t("t_" + b.type).split(" (")[0]} · {money(b.price_cents, b.currency)}</div>
    <div>{b.owners?.full_name}{b.owners?.phone ? ` · ${b.owners.phone}` : ""}{b.pets?.name ? ` — ${b.pets.name}` : ""}</div>
    {b.motive && <small>{b.motive}</small>}{b.address && <div><small>{b.address}{b.access_notes ? ` · ${b.access_notes}` : ""}</small></div>}
    {b.status === "confirmed" && b.video_room && b.type === "video" && <div><a href={`/visio/${b.id}`}>{t("join")}</a></div>}
    {actions && <div style={{ marginTop: 10 }}>{replyFor === b.id && <input className="field" style={{ marginBottom: 8 }} placeholder={t("reason")} value={reply} onChange={(e) => setReply(e.target.value)} />}
      <button className="btn" onClick={() => act(b.id, "confirm")}>{t("accept")}</button>{" "}<button className="btn btn-ghost" onClick={() => (replyFor === b.id ? act(b.id, "decline") : setReplyFor(b.id))}>{t("decline")}</button></div>}
  </div>;
  const Pill = ({ k, label, I }: { k: Tab; label: string; I: typeof Clock }) => <button className="nav" aria-current={tab === k ? "page" : undefined} onClick={() => { setTab(k); setSub("menu"); setVetId(k === "vets" ? "" : vetId); }}><I aria-hidden />{label}{k === "agenda" && pending.length ? ` (${pending.length})` : ""}</button>;
  const vetSvcs = svcs.filter((s) => s.practitioner_id === vetId);
  const tzList: string[] = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [p.timezone];

  return (
    <div className="app">
      <aside className="side">
        <a className="brand" href={`/${lang}/${country.toLowerCase()}/`}><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 29C6 21.6 2 17.2 2 11.6 2 7.4 5.2 4.5 9 4.5c2.6 0 5 1.4 7 4 2-2.6 4.4-4 7-4 3.8 0 7 2.9 7 7.1 0 5.6-4 10-14 17.4Z" /></svg>televet</a>
        <Pill k="agenda" label={t("nAgenda")} I={CalendarDays} /><Pill k="clinic" label={t("nClinic")} I={Hospital} /><Pill k="vets" label={t("nVets")} I={Stethoscope} /><Pill k="settings" label={t("nSettings")} I={Settings} /><Pill k="reminders" label={t("nReminders")} I={BellRing} />
        <div className="who">{p.name}<br /><button onClick={async () => { await signOut(); setSigned(false); }}>{t("out")}</button></div>
      </aside>
      <div className="main">
        <p style={{ margin: "0 0 18px" }}>{p.published ? <span className="chip ok">{t("live")}</span> : <span className="chip wait">{t("review")}</span>}</p>

        {tab === "agenda" && <section><h1>{t("nAgenda")}</h1>
          <div className="stats">
            <div className="stat t-sun" style={{ ["--tile" as string]: "var(--sun-bg)" }}><span className="ico t-sun"><VI n="clock" size={34} /></span><div><b>{pending.length}</b><span>{t("pending")}</span></div></div>
            <div className="stat t-sky" style={{ ["--tile" as string]: "var(--sky-bg)" }}><span className="ico t-sky"><VI n="calendar" size={34} /></span><div><b>{upcoming.length}</b><span>{t("upcoming")}</span></div></div>
            <div className="stat t-mint" style={{ ["--tile" as string]: "var(--mint-bg)" }}><span className="ico t-mint"><VI n="vet" size={34} /></span><div><b>{vets.length}</b><span>{t("nVets")}</span></div></div></div>
          {pending.length > 0 && <><h2>{t("pending")}</h2>{pending.map((b) => row(b, true))}</>}
          <h2>{t("upcoming")}</h2>{upcoming.length ? upcoming.map((b) => row(b, false)) : <p>{t("none")}</p>}
          {past.length > 0 && <><h2>{t("past")}</h2>{past.slice(0, 30).map((b) => row(b, false))}</>}</section>}

        {tab === "clinic" && <section><h1>{t("clinicProfile")}</h1>
          <PhotoPick src={p.logo_url} name={p.name} onFile={(u) => saveP({ logo_url: u })} />
          <div className="grid2">
            <div><label className="label">{t("name")}</label><input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
            <div><label className="label">{t("email")}</label><input className="field" type="email" value={p.email ?? ""} onChange={(e) => setP({ ...p, email: e.target.value })} /></div>
            <div><label className="label">{t("phone")}</label><input className="field" value={p.phone ?? ""} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
            <div><label className="label">{t("address")}</label><input className="field" value={p.address ?? ""} onChange={(e) => setP({ ...p, address: e.target.value })} /></div>
            <div><label className="label">{t("postal")}</label><input className="field" value={p.postal_code ?? ""} onChange={(e) => setP({ ...p, postal_code: e.target.value })} /></div>
            <div><label className="label">{t("tz")}</label><select className="field" value={p.timezone} onChange={(e) => setP({ ...p, timezone: e.target.value })}>{tzList.map((z) => <option key={z}>{z}</option>)}</select></div></div>
          <div className="grid2">
            <div><label className="label">{t("city")}</label><input className="field" value={p.city ?? ""} onChange={(e) => setP({ ...p, city: e.target.value })} /></div>
            <div><label className="label">{t("website")}</label><input className="field" type="url" placeholder="https://" value={p.website ?? ""} onChange={(e) => setP({ ...p, website: e.target.value })} /></div>
            <div><label className="label">{t("founded")}</label><input className="field" inputMode="numeric" value={p.founded_year ?? ""} onChange={(e) => setP({ ...p, founded_year: Number(e.target.value) || null })} /></div></div>
          <label className="label">{t("headline")}</label><input className="field" maxLength={140} value={p.headline ?? ""} onChange={(e) => setP({ ...p, headline: e.target.value })} />
          <label className="label">{t("about")}</label><textarea className="field" value={p.about ?? ""} onChange={(e) => setP({ ...p, about: e.target.value })} />
          <label className="label">{t("langs")}</label><div className="days">{languages.map((l) => <label key={l}><input type="checkbox" checked={p.languages.includes(l)} onChange={(e) => setP({ ...p, languages: e.target.checked ? [...p.languages, l] : p.languages.filter((x) => x !== l) })} />{new Intl.DisplayNames([lang], { type: "language" }).of(l)}</label>)}</div>
          <label className="label">{t("accessInfo")}</label><textarea className="field" style={{ minHeight: 70 }} value={p.access_info ?? ""} onChange={(e) => setP({ ...p, access_info: e.target.value })} />
          <label className="label">{t("facL")}</label><Checks keys={Object.keys(PCt.fac)} labels={PCt.fac} value={p.facilities ?? []} onChange={(v) => setP({ ...p, facilities: v })} />
          <label className="label">{t("payL")}</label><Checks keys={Object.keys(PCt.pay)} labels={PCt.pay} value={p.payment_methods ?? []} onChange={(v) => setP({ ...p, payment_methods: v })} />
          <label className="label">{t("animalsL")}</label><Checks keys={Object.keys(PCt.sp)} labels={PCt.sp} value={p.species ?? []} onChange={(v) => setP({ ...p, species: v })} />
          <p><a href={`/${lang}/${country.toLowerCase()}/veterinaire/${p.slug}`} target="_blank" rel="noopener noreferrer">{t("pageLink")}</a></p>
          <label className="panel" style={{ display: "block", marginTop: 22 }}><input type="checkbox" checked={p.auto_confirm} onChange={(e) => setP({ ...p, auto_confirm: e.target.checked })} /> <strong>{t("auto")}</strong><br /><small>{t("autoHelp")}</small></label>
          <p><button className="btn" onClick={() => saveP({})}>{t("confirm")}</button></p></section>}

        {tab === "vets" && sub === "menu" && !vetId && <section><h1>{t("nVets")}</h1>
          <div className="vets">{vets.map((v) => <div key={v.id} className="vetcard"><Avatar src={v.photo_url} name={v.display_name} /><strong style={{ fontFamily: "var(--display)", fontSize: "1.15rem" }}>{v.display_name}</strong>
            <button className="btn btn-edit" onClick={() => { setVetId(v.id); setSub("menu"); }}>{t("edit")}</button><button className="btn btn-del" onClick={() => delVet(v)}>{t("del")}</button></div>)}</div>
          <button className="fab" aria-label={t("add")} title={t("add")} onClick={addVet}>+</button></section>}

        {tab === "vets" && vetId && vet && <section>
          <button className="btn btn-quiet" onClick={() => (sub === "menu" ? setVetId("") : setSub("menu"))}>← {t("back")}</button>
          <h1>{vet.display_name}</h1>
          {sub === "menu" && <ul className="menu-list">{([["info", "mInfo"], ["hours", "mHours"], ["services", "mServices"], ["holidays", "mHolidays"], ["video", "mVideo"], ["cal", "mCal"]] as const).map(([k, l]) => <li key={k}><button onClick={() => setSub(k)}>{t(l)}<span aria-hidden>›</span></button></li>)}</ul>}
          {sub === "info" && <div><h2>{t("mInfo")}</h2><PhotoPick src={vet.photo_url} name={vet.display_name} onFile={(u) => saveVet({ photo_url: u })} />
            <label className="label">{t("name")}</label><input className="field" value={vet.display_name} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, display_name: e.target.value } : v)))} />
            <label className="label">{t("vTitle")}</label><input className="field" maxLength={12} value={vet.title ?? ""} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, title: e.target.value } : v)))} />
            <label className="label">{t("vSpec")}</label><input className="field" value={(vet.specialties ?? []).join(", ")} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, specialties: e.target.value.split(",").map((x) => x.trimStart()) } : v)))} />
            <label className="label">{t("vBio")}</label><textarea className="field" style={{ minHeight: 90 }} value={vet.bio ?? ""} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, bio: e.target.value } : v)))} />
            <label className="label">{t("vSchool")}</label><input className="field" value={vet.school ?? ""} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, school: e.target.value } : v)))} />
            <label className="label">{t("vYears")}</label><input className="field" inputMode="numeric" value={vet.experience_years ?? ""} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, experience_years: e.target.value === "" ? null : Math.min(70, Number(e.target.value) || 0) } : v)))} />
            <label className="label">{t("langs")}</label><Checks keys={languages} labels={Object.fromEntries(languages.map((l) => [l, new Intl.DisplayNames([lang], { type: "language" }).of(l) ?? l]))} value={vet.languages ?? []} onChange={(l) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, languages: l } : v)))} />
            <label className="label">{t("animalsL")}</label><Checks keys={Object.keys(PCt.sp)} labels={PCt.sp} value={vet.species ?? []} onChange={(l) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, species: l } : v)))} />
            <label className="label">{t("lead")}</label><input className="field" inputMode="numeric" value={vet.lead_time_min} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, lead_time_min: Number(e.target.value) || 0 } : v)))} />
            <p style={{ marginTop: 18 }}><button className="btn" onClick={() => saveVet({ display_name: vet.display_name, lead_time_min: vet.lead_time_min, title: vet.title?.trim() || null, specialties: (vet.specialties ?? []).map((x) => x.trim()).filter(Boolean), bio: vet.bio?.trim() || null, school: vet.school?.trim() || null, experience_years: vet.experience_years, languages: vet.languages ?? [], species: vet.species ?? [], slug: vet.slug || slugOf(vet.display_name) || null })}>{t("confirm")}</button></p></div>}
          {sub === "hours" && <div><h2>{t("mHours")}</h2>{[1, 2, 3, 4, 5, 6, 0].map((d) => { const r = rules.find((x) => x.weekday === d); return <div key={d} className="row" style={{ margin: "8px 0" }}>
            <label style={{ width: 80 }}><input type="checkbox" checked={!!r} onChange={(e) => setRules(e.target.checked ? [...rules, { weekday: d, start_time: "09:00", end_time: "18:00" }] : rules.filter((x) => x.weekday !== d))} /> {dayNames[d]}</label>
            {r && <>{t("from")} <input className="field" style={{ width: 130 }} type="time" value={r.start_time.slice(0, 5)} onChange={(e) => setRules(rules.map((x) => (x.weekday === d ? { ...x, start_time: e.target.value } : x)))} /> {t("to")} <input className="field" style={{ width: 130 }} type="time" value={r.end_time.slice(0, 5)} onChange={(e) => setRules(rules.map((x) => (x.weekday === d ? { ...x, end_time: e.target.value } : x)))} /></>}</div>; })}
            <p style={{ marginTop: 18 }}><button className="btn" onClick={saveHours}>{t("confirm")}</button></p></div>}
          {sub === "services" && <div><h2>{t("mServices")}</h2>
            {vetSvcs.map((s) => <div key={s.id} className="panel row" style={{ justifyContent: "space-between" }}><div><strong>{s.custom_name ?? t("t_" + s.type).split(" (")[0]}</strong>{!s.active && <span className="chip"> off</span>}<div><small>{t("t_" + s.type).split(" (")[0]} · {s.duration_min} min · {money(s.price_cents, s.currency)}</small></div></div><button className="btn btn-ghost" onClick={() => setEditSvc(s)}>{t("edit")}</button></div>)}
            <p><button className="btn" onClick={() => setEditSvc({ id: "", practitioner_id: vetId, type: "video", custom_name: "", description: "", duration_min: 20, price_cents: 0, currency: svcs[0]?.currency ?? currency, active: true, online_payment: true, weekdays: [0, 1, 2, 3, 4, 5, 6], confirmation_note: "", reminder_note: "", catalog_code: "" })}>+ {t("newSvc")}</button></p></div>}
          {sub === "holidays" && <div><h2>{t("mHolidays")}</h2>
            <div className="grid2"><div><label className="label">{t("hStart")}</label><input className="field" type="date" value={hol.from} onChange={(e) => setHol({ ...hol, from: e.target.value })} /></div><div><label className="label">{t("hEnd")}</label><input className="field" type="date" value={hol.to} min={hol.from} onChange={(e) => setHol({ ...hol, to: e.target.value })} /></div></div>
            <label className="label">{t("hReason")}</label><input className="field" value={hol.reason} onChange={(e) => setHol({ ...hol, reason: e.target.value })} />
            <p style={{ marginTop: 14 }}><button className="btn" disabled={!hol.from} onClick={addHoliday}>{t("hAdd")}</button></p>
            {blocks.length === 0 ? <p>{t("hNone")}</p> : blocks.map((b) => <div key={b.id} className="panel row" style={{ justifyContent: "space-between" }}><span>{new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: p.timezone }).format(new Date(b.starts_at))} → {new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: p.timezone }).format(new Date(new Date(b.ends_at).getTime() - 1))}{b.reason ? ` · ${b.reason}` : ""}</span>
              <button className="btn btn-quiet" onClick={async () => { await sb.from("blocks").delete().eq("id", b.id); setBlocks(blocks.filter((x) => x.id !== b.id)); }}>{t("del")}</button></div>)}</div>}
          {sub === "video" && <div><h2>{t("mVideo")}</h2><p>{t("videoHelp")}</p><input className="field" type="url" placeholder="https://" value={vet.video_link ?? ""} onChange={(e) => setVets(vets.map((v) => (v.id === vet.id ? { ...v, video_link: e.target.value } : v)))} />
            <p style={{ marginTop: 18 }}><button className="btn" onClick={() => saveVet({ video_link: vet.video_link?.trim() || null })}>{t("confirm")}</button></p></div>}
          {sub === "cal" && <div><h2>{t("mCal")}</h2><p>{t("calHelp")}</p>
            <div className="panel"><strong>Google Calendar</strong> <span className={`chip ${conns.some((c) => c.practitioner_id === vetId && c.provider === "google") ? "ok" : ""}`}>{conns.some((c) => c.practitioner_id === vetId && c.provider === "google") ? t("connected") : t("notConn")}</span>
              <p style={{ marginTop: 10 }}><button className="btn btn-ghost" onClick={() => connect("/api/calendar/google", { practitionerId: vetId })}>Google Calendar</button></p></div>
            {PIMS.map(([k, label]) => { const c = conns.find((x) => x.practitioner_id === vetId && x.provider === k); return <div key={k} className="panel"><strong>{label}</strong> <span className={`chip ${c ? "ok" : ""}`}>{c ? t("connected") : t("notConn")}</span>
              {!c ? <div className="copy" style={{ marginTop: 10 }}><input className="field" placeholder={t("token")} value={tokens[k] ?? ""} onChange={(e) => setTokens({ ...tokens, [k]: e.target.value })} /><button className="btn" disabled={!tokens[k]} onClick={() => pims("POST", k)}>{t("activate")}</button></div>
                : <><p><small>{t("pimsNote")}</small></p><button className="btn btn-ghost" onClick={() => pims("DELETE", k)}>{t("disconnect")}</button></>}</div>; })}
            {feed && <div className="panel"><strong>iCal</strong><p><small>{t("feed")}</small></p><input className="field" readOnly value={feed} onFocus={(e) => e.currentTarget.select()} /></div>}</div>}
        </section>}

        {tab === "settings" && <section><h1>{t("nSettings")}</h1>
          <div className="panel"><h3>{t("setBooking")}</h3><label className="label">{t("url")}</label>
            <div className="copy"><input className="field" readOnly value={bookUrl} onFocus={(e) => e.currentTarget.select()} /><button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(bookUrl); flash(t("copied")); }}>{t("copy")}</button></div>
            <label className="label">{t("bTitle")}</label><input className="field" value={p.widget_title ?? ""} onChange={(e) => setP({ ...p, widget_title: e.target.value })} />
            <p style={{ marginTop: 14 }}><button className="btn" onClick={() => saveP({})}>{t("confirm")}</button></p>
            <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "18px 0" }} /><p className={p.booking_enabled ? "ok-text" : "alert"}>{p.booking_enabled ? t("bOn") : t("bOff")}</p>
            <button className={p.booking_enabled ? "btn btn-ghost" : "btn"} onClick={() => saveP({ booking_enabled: !p.booking_enabled })}>{p.booking_enabled ? t("turnOff") : t("turnOn")}</button></div>
          <div className="panel"><h3>{t("pay")}</h3><p>{t("payState")}: <strong>{payState}</strong> <span className={`chip ${payState === "active" ? "ok" : "wait"}`}>{provider === "stripe" ? "Stripe" : "Mercado Pago"}</span></p>
            {payState !== "active" && <button className="btn" onClick={() => connect(`/api/connect/${provider}`, { practiceId: p.id })}>{t("connectPay")}</button>}</div>
          <div className="panel"><h3>{t("calendars")}</h3><p>{t("calHelp")}</p>{vets.map((v) => <p key={v.id}><button className="btn btn-ghost" onClick={() => { setTab("vets"); setVetId(v.id); setSub("cal"); }}>{v.display_name} — {conns.filter((c) => c.practitioner_id === v.id).map((c) => c.provider).join(", ") || t("notConn")}</button></p>)}</div></section>}

        {tab === "reminders" && <section><h1>{t("nReminders")}</h1>
          <div className="panel"><h3>{t("remTitle")}</h3>
            <label style={{ display: "block", margin: "10px 0" }}><input type="checkbox" checked={p.reminders?.e24 ?? true} onChange={(e) => setP({ ...p, reminders: { ...p.reminders, e24: e.target.checked } })} /> {t("rem24")}</label>
            <label style={{ display: "block", margin: "10px 0" }}><input type="checkbox" checked={p.reminders?.e2 ?? true} onChange={(e) => setP({ ...p, reminders: { ...p.reminders, e2: e.target.checked } })} /> {t("rem2")}</label>
            <label className="label">{t("emailLang")}</label><select className="field" value={p.email_language ?? lang} onChange={(e) => setP({ ...p, email_language: e.target.value })}>{["fr", "it", "en", "es", "pt", "de", "pl", "nl"].map((l) => <option key={l} value={l}>{new Intl.DisplayNames([lang], { type: "language" }).of(l)}</option>)}</select>
            <p style={{ marginTop: 14 }}><button className="btn" onClick={() => saveP({})}>{t("confirm")}</button></p></div></section>}
      </div>

      {editSvc && <div className="modal-bg" onClick={() => setEditSvc(null)}><div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{editSvc.id ? t("mServices") : t("newSvc")}</h2>
        <label className="label">{t("svcName")}</label><input className="field" value={editSvc.custom_name ?? ""} onChange={(e) => setEditSvc({ ...editSvc, custom_name: e.target.value })} />
        <label className="label">{t("desc")}</label><textarea className="field" value={editSvc.description ?? ""} onChange={(e) => setEditSvc({ ...editSvc, description: e.target.value })} />
        <label className="label">{t("type")}</label><div className="days">{(["clinic", "video", "home", "expertise"] as const).map((k) => <label key={k}><input type="radio" name="stype" checked={editSvc.type === k} onChange={() => setEditSvc({ ...editSvc, type: k })} />{t("t_" + k)}</label>)}</div>
        <div className="grid2"><div><label className="label">{t("price")} ({editSvc.currency || svcs[0]?.currency || "EUR"})</label><input className="field" inputMode="decimal" value={editSvc.currency && ZERO_DECIMAL.has(editSvc.currency) ? editSvc.price_cents : editSvc.price_cents / 100} onChange={(e) => { const v = Number(e.target.value.replace(",", ".")) || 0; setEditSvc({ ...editSvc, price_cents: ZERO_DECIMAL.has(editSvc.currency) ? Math.round(v) : Math.round(v * 100) }); }} /></div>
          <div><label className="label">{t("dur")}</label><input className="field" inputMode="numeric" value={editSvc.duration_min} onChange={(e) => setEditSvc({ ...editSvc, duration_min: Number(e.target.value) || 0 })} /></div></div>
        <label className="label">{t("daysOffered")}</label><div className="days">{[1, 2, 3, 4, 5, 6, 0].map((d) => <label key={d}><input type="checkbox" checked={editSvc.weekdays.includes(d)} onChange={(e) => setEditSvc({ ...editSvc, weekdays: e.target.checked ? [...editSvc.weekdays, d] : editSvc.weekdays.filter((x) => x !== d) })} />{dayNames[d]}</label>)}</div>
        <label className="label"><input type="checkbox" checked={editSvc.online_payment} onChange={(e) => setEditSvc({ ...editSvc, online_payment: e.target.checked })} /> {t("payOnline")}</label>
        <label className="label"><input type="checkbox" checked={editSvc.active} onChange={(e) => setEditSvc({ ...editSvc, active: e.target.checked })} /> {t("active")}</label>
        <label className="label">{t("confNote")}</label><textarea className="field" value={editSvc.confirmation_note ?? ""} onChange={(e) => setEditSvc({ ...editSvc, confirmation_note: e.target.value })} />
        <label className="label">{t("remNote")}</label><textarea className="field" value={editSvc.reminder_note ?? ""} onChange={(e) => setEditSvc({ ...editSvc, reminder_note: e.target.value })} />
        <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>{editSvc.id && <button className="btn btn-quiet" onClick={() => delSvc(editSvc)}>{t("del")}</button>}<button className="btn btn-ghost" onClick={() => setEditSvc(null)}>{t("close")}</button><button className="btn" onClick={saveSvc}>{t("confirm")}</button></div></div></div>}
      {toast && <div className={`toast${toast.bad ? " bad" : ""}`} role="status">{toast.m}</div>}
    </div>
  );
}
