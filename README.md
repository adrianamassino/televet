# Televet — piattaforma (codice reale)

Backend di produzione di Televet: database, sicurezza, disponibilità, prenotazioni, pagamenti (Stripe Connect e Mercado Pago), sincronizzazione agende (Google Calendar, iCal, Vetup, Petbooqz). Il prototipo cliccabile (`televet-app.html`) resta il riferimento di design per le interfacce.

## Stato

| Parte | Stato |
|---|---|
| Database PostgreSQL con sicurezza per riga (RLS), 17 paesi incluso Australia | ✅ `supabase/migrations/0001_init.sql` |
| Motore di disponibilità (fusi orari, ora legale, preavviso, tempi di spostamento) | ✅ testato |
| Zone a domicilio (CAP, raggio, poligono, zona allargata con supplemento) | ✅ testato |
| Prenotazione con controlli lato server + blocco dei doppi appuntamenti nel database | ✅ |
| Stripe Connect: onboarding Express, pagamento autorizzato e incassato alla conferma, commissione Televet, webhook | ✅ |
| Mercado Pago: OAuth del veterinario, Checkout Pro con `marketplace_fee`, rimborso, webhook | ✅ |
| Google Calendar: OAuth, lettura occupato, scrittura appuntamenti | ✅ |
| Videoconsulto integrato (Daily): stanza privata per appuntamento, link nell'area privata e nelle email, apertura 15 min prima | ✅ `src/lib/video.ts`, `/visio/:id`, `/api/bookings/:id/video` |
| Email di conferma e promemoria 24 h / 2 h (7 lingue) | ✅ `src/lib/email/templates.ts`, `/api/cron/reminders` |
| Resoconto della visita: bozza IA dalla trascrizione (con consenso), modifica e convalida del veterinario, invio al proprietario | ✅ `src/lib/report.ts`, `/api/reports/:id/*` — trascrizione Daily da collegare (vedi sotto) |
| Ricerca luoghi gratuita (OpenStreetMap/Photon, nessuna chiave Google necessaria) | ✅ `/api/places` |
| iCal: feed privato per Apple Calendario / Outlook + importazione di un URL .ics (ricorrenze incluse) | ✅ testato |
| Vetup, VetIt, Petbooqz | ⏳ connettori pronti: da riprendere dal codice attuale di app.televet.co (vedi sotto) |
| Migrazione delle sincronizzazioni esistenti | ✅ `scripts/import-legacy-connections.ts` |
| Interfacce proprietari e veterinari (web + app iOS/Android) | ⏳ prossima fase, da costruire sopra queste API |

Verifiche eseguite: `npm run typecheck` (0 errori), `npm test` (9/9), `npm run build` (ok).

## Avvio in 8 passi

1. **Supabase** → crea un progetto su supabase.com, poi esegui nell'editor SQL, in ordine, `supabase/migrations/0001` … `0005` (tutti e cinque, non solo il primo).
2. **Stripe** → attiva Connect (tipo Express), crea un endpoint webhook verso `https://TUO-DOMINIO/api/webhooks/stripe` con gli eventi `account.updated`, `payment_intent.*`, `charge.refunded`.
3. **Mercado Pago** → per ogni paese (AR, UY, CL, MX, BR) crea un'applicazione nel pannello sviluppatori, attiva il modello marketplace e imposta il redirect `https://TUO-DOMINIO/api/connect/mercadopago/callback` e le notifiche verso `/api/webhooks/mercadopago`.
4. **Google Cloud** → crea un client OAuth (redirect `/api/calendar/google/callback`), abilita Calendar API e Geocoding API, e avvia subito la **verifica dell'app** (richiede alcune settimane).
5. **Email** → crea un account Resend (o altro provider) e verifica il dominio televet.co.
6. Copia `.env.example` in `.env.local` e compila le chiavi.
7. `npm install && npm run dev` in locale, poi deploy su **Vercel** (serve il piano **Pro**: uso commerciale non ammesso su Hobby, e i cron ogni 10/15 minuti di `vercel.json` falliscono il deploy su Hobby).
8. Nel database imposta la commissione di default per paese (`countries.default_commission_pct`) e pubblica i paesi (`published = true`).

## API principali

| Endpoint | Uso |
|---|---|
| `GET /api/availability?service=&practitioner=&from=&days=` | orari liberi reali |
| `POST /api/bookings` | crea la prenotazione, verifica zona e disponibilità, avvia il pagamento |
| `POST /api/bookings/:id/confirm` · `/decline` | il veterinario accetta (incasso) o rifiuta (nessun addebito / rimborso) |
| `POST /api/connect/stripe` · `/api/connect/mercadopago` | collegamento dei conti per ricevere i pagamenti |
| `POST /api/calendar/google` · `/api/calendar/ical` | collegamento agende |
| `GET /api/ical/<token>.ics` | feed privato da aggiungere in Apple Calendario, Outlook, Google |

## Riprendere le sincronizzazioni esistenti (Vetup, VetIt, Petbooqz, Google)

L'attuale app.televet.co è già collegata a questi software. Per non far ricollegare le cliniche:

1. **Codice dei connettori**: recuperare dal vecchio progetto i moduli che chiamano Vetup, VetIt e Petbooqz e riportarli nei due metodi di `src/lib/calendar/pims.ts` (`getBusy`, `pushBooking`). Endpoint e credenziali restano gli stessi.
2. **Dati delle connessioni**: esportare dal vecchio database, per ogni clinica collegata, email del veterinario, software, identificativo agenda e credenziali (chiave API o token), poi eseguire `npx tsx scripts/import-legacy-connections.ts export.json`.
3. **Google Calendar**: i token esistenti funzionano solo se la nuova piattaforma usa lo **stesso client OAuth Google** (stesso progetto Google Cloud). Serve quindi l'accesso a quel progetto; altrimenti ogni veterinario riclicca una volta "Collega".
4. Contratti partner: verificare che gli accordi API con Vetup, VetIt e Petbooqz siano intestati a Televet (non al freelance) e restino validi per la nuova piattaforma.

## Prossima fase: interfacce

- **Sito web proprietari + Televet Pro web**: pagine Next.js in questo progetto, con traduzioni e URL `/{lingua}/{paese}/…` per la SEO.
- **App iOS e Android** (Televet e Televet Pro): React Native con Expo, che riusano le stesse API; notifiche push con Expo Notifications.
- Riferimento visivo: il prototipo `televet-app.html`.

## Da verificare prima del lancio in ogni paese

Regole di telemedicina veterinaria e testi legali, IVA/fatturazione, disponibilità del provider di pagamento, traduzioni riviste da madrelingua.

## Resoconto automatico delle visite

1. Alla prenotazione in video il proprietario spunta il consenso alla trascrizione (`transcript_consent`).
2. A fine chiamata la trascrizione viene inviata a `POST /api/reports/:id/draft` (header `Authorization: Bearer CRON_SECRET`, body `{ "transcript": "…" }`). Fonte consigliata: la trascrizione di Daily; attivarla nel pannello Daily e collegare il suo webhook a questo endpoint (verificare nella documentazione Daily il formato esatto della notifica "trascrizione pronta").
3. Claude redige una bozza strutturata (motivo, osservazioni, consigli, follow-up, segnali d'allarme), senza inventare nulla e senza diagnosi o ricette dove la legge non le consente a distanza.
4. Il veterinario la corregge e la convalida (`POST /api/reports/:id/validate`): solo allora parte l'email al proprietario e la trascrizione viene cancellata.

## SEO

- Pagine renderizzate lato server con `title`, `description`, `canonical`, **hreflang** per tutte le combinazioni lingua-paese (+ `x-default`), Open Graph e Twitter (`src/lib/seo.ts`).
- Dati strutturati JSON-LD: `Organization`, `FAQPage`, `BreadcrumbList`, `VeterinaryCare` (profili), `SoftwareApplication` (pagina veterinari).
- Pagine servizio × città generate solo dove esistono veterinari pubblicati: `/fr/fr/veterinaire-a-domicile/paris-11e`, `/es/ar/veterinario-online` … (nessuna pagina vuota indicizzata).
- `sitemap.xml` dinamica con alternates hreflang, `robots.txt` che esclude API, visio e aree private.
- FAQ importata da televet.co in `content/faq/fr.json` (25 domande). Le traduzioni vanno aggiunte come `content/faq/<lingua>.json`; finché mancano, la FAQ di quella lingua non è indicizzata.
- Redirect 301 dagli URL Wix attuali in `next.config.mjs` (completare con l'elenco completo degli articoli del blog).
- Immagini: usare `next/image` con `alt` descrittivo nella lingua della pagina, nomi file parlanti (`veterinaire-domicile-chat-paris.jpg`), dimensioni esplicite, formati AVIF/WebP.

## Annuario delle cliniche (come Doctolib)

- Tabella `directory_listings`: tutte le cliniche di ogni paese, anche senza Televet. Le schede "non rivendicate" mostrano indirizzo e "prenotazione online non disponibile", con "Avvisami" per i proprietari e "È la mia clinica" per i veterinari.
- Fonti: **Francia** → base SIRENE dell'INSEE (codice NAF 75.00Z, licenza aperta Etalab; `scripts/import-sirene.ts`, solo stabilimenti diffondibili). **Altri paesi** → OpenStreetMap (`scripts/import-osm.ts IT`, licenza ODbL con attribuzione). Si possono aggiungere i registri ufficiali di ogni paese (es. Companies House nel Regno Unito).
- Rivendicazione (niente telefono/SMS): **1)** la clinica viene abbinata alla sua scheda Google Business (Places API, conservando solo il `place_id`), che deve risultare attiva; **2)** l'email professionale deve avere il dominio del sito indicato su quella scheda (no Gmail/Hotmail…); **3)** un codice a 6 cifre viene inviato a quell'email. In alternativa: documento verificato dal team Televet (`/api/admin/claims/:id`).
- All'iscrizione, `directory_match` (ricerca approssimata pg_trgm) propone le cliniche già presenti con nome o codice postale simile.
- Pagine SEO `/[lingua]/[paese]/annuaire/[città]`.
- GDPR: pubblicare solo dati di strutture (non di persone fisiche che si sono opposte), mostrare la fonte, e offrire un modulo di rimozione/rettifica.

## Blog (migrazione da Wix)

1. `npm install`
2. `npm run import:blog -- --limit 3` → prova su 3 articoli; confronta i file in `content/blog/fr/` con gli articoli online (titolo, titoli h2, tabelle, immagini, link).
3. Se il corpo è vuoto o sporco, correggi `BODY_SELECTORS` in `scripts/import-wix-blog.ts`, poi `npm run import:blog` per tutti (~50 articoli, FR + IT). Rapporto in `content/blog/_import-report.json`.
4. Immagini scaricate in `public/blog/<slug>/`; alt lunghi (liste di parole chiave Wix) sostituiti col titolo — rivedere a mano gli articoli principali.
5. Pagine: `/{lang}/{lang}/blog` e `/{lang}/{lang}/blog/{slug}` (BlogPosting JSON-LD, canonical, sitemap). Le categorie Wix non hanno equivalente: redirect all'indice.
6. `next.config.mjs` genera da solo un 301 per ogni articolo: `/post/<slug>` → `/fr/fr/blog/<slug>`, `/it/post/<slug>` → `/it/it/blog/<slug>`. Verifica con `curl -I` su 5 URL prima di spostare il dominio.
7. Il feed `/blog-feed.xml` di Wix sparisce al cambio dominio: aggiungere un redirect/feed se qualcuno lo usa.

## Chat assistente (popup nel sito)

- **Widget**: `src/components/ChatWidget.tsx`, montato in `src/app/layout.tsx` (nascosto in `/admin`, `/visio`, `/auth`). Lingue: fr, it, en, es (le altre usano l'inglese). Avviso fisso: assistente IA, conversazione registrata, non condividere dati sensibili.
- **Cervello**: `POST /api/chat` → Claude (`CHAT_MODEL`, default `claude-sonnet-5-5`). Regole in `src/lib/chat.ts` (`buildSystemPrompt`): proprietari → primi consigli prudenti (mai diagnosi, mai farmaci/dosi) + pulsante per prenotare con un veterinario Televet; veterinari → guida passo passo alla creazione account; fuori tema → rifiuta con garbo; richiesta di un umano → segnala al team.
- **Sicurezza**: il modello non scrive mai URL, sceglie solo "chiavi" di destinazione che il server traduce in pagine nostre; qualunque URL/e-mail nel testo viene rimosso. Le parole di emergenza (fr/it/en/es) sono rilevate anche dal server e mostrano il banner rosso. Se l'IA non risponde, parte una risposta di emergenza con i pulsanti.
- **Conoscenza**: `content/chat/facts.json` (cosa fa Televet, passi di iscrizione, cosa NON promettere; i prezzi non sono elencati: il bot dice "prezzo accessibile, deciso da ogni veterinario e mostrato prima di confermare") + FAQ francese. Il bot afferma solo ciò che è lì: completare/correggere il file senza toccare il codice.
- **Admin dipendenti**: `/admin/chats` (login Supabase; solo e-mail in `ADMIN_EMAILS`): filtri per stato/pubblico/urgenza, ricerca nei messaggi, trascrizione completa, stato (nuova / da richiamare / gestita / archiviata), nota interna, pulsanti cliccati (prenotazione, iscrizione).
- **Protezioni**: 40 messaggi per IP/ora, 40 scambi per conversazione, tetto giornaliero `CHAT_DAILY_LIMIT` (costo massimo). L'IP si salva solo come HMAC.
- **Privacy**: conversazioni cancellate dopo `CHAT_RETENTION_DAYS` (default 90) dal cron `/api/cron/purge-chats`.
- **Attivazione**: eseguire `supabase/migrations/0006_chat.sql`; impostare `ANTHROPIC_API_KEY`, `ADMIN_EMAILS`, `CHAT_HASH_SECRET`; creare in Supabase (Authentication → Users) un utente per ogni dipendente.

### Chat: paesi, lingue e disponibilità
- Il bot risponde nella lingua dell'utente (qualsiasi). Interfaccia fissa (benvenuto, avviso, pulsanti) in fr, it, en, es, pt, de, pl, nl; altre lingue → inglese. Traduzioni pt/de/pl/nl da far rivedere a un madrelingua.
- Paese: dall'URL (`/it/it/...`); sulle pagine senza paese (home) dall'IP (`x-vercel-ip-country`) e dalla lingua del browser.
- `src/lib/coverage.ts` conta i veterinari pubblicati per paese e servizio (cache 10 min). Il bot lo sa: se nel paese non c'è nessuno per quel servizio lo dice con onestà, non mostra il pulsante di prenotazione e propone di scrivere al team. Finché non c'è nessun veterinario pubblicato (pre-lancio) non filtra nulla.
- I veterinari online rispondono da tutto il paese: `/{lang}/{country}/{servizio}` (es. `/it/it/veterinario-online`) elenca tutti quelli del paese, senza città. Domicilio e cliniche usano la stessa pagina e poi `/{servizio}/{città}`. Senza veterinari la pagina risponde (noindex) invece di dare 404.

## Pagine pubbliche: `/pro` e scheda veterinario

- `/{lang}/{country}/pro`: landing per veterinari in 8 lingue (testi in `src/lib/pro-copy.ts`). Il bottone "Crea il mio profilo" va a `PRO_SIGNUP_URL` (vuoto = e-mail a contact@televet.co). Le lingue senza traduzione mostrano l'inglese e non vengono indicizzate.
- `/{lang}/{country}/veterinaire/{slug}`: scheda pubblica (solo studi con `published = true`; altrimenti 404). Mostra servizi, durata e il prezzo impostato dal veterinario, lingue, JSON-LD `VeterinaryCare`.
- Il bottone "Prenota" compare solo se `BOOKING_URL` è impostato: la pagina di prenotazione non fa ancora parte di questo modulo.
- Prima di pubblicare `/pro`: far verificare i testi (soprattutto pt/de/pl/nl) e le frasi su registrazione/trascrizione della visita, che devono corrispondere a ciò che il prodotto fa davvero.

## Hosting senza Vercel (Netlify) e cron con GitHub Actions

- Il sito è Next.js standard: su Netlify basta importare il repository (rileva Next.js da solo) e inserire le variabili di `.env.example`. Prima del lancio commerciale controlla le condizioni del piano gratuito.
- `vercel.json` serve solo su Vercel e su Netlify viene ignorato. I cron girano da `.github/workflows/cron.yml`: aggiungi in GitHub il secret `CRON_SECRET` (lo stesso del sito) e la variabile `APP_URL`. Ogni 15 minuti promemoria e sincronizzazione calendari; alle 3 la pulizia delle chat.
- I redirect dei vecchi link Wix sono in `next.config.mjs` e funzionano su qualsiasi hosting che esegua Next.js.

## Registrazione veterinario
`/{lingua}/{paese}/pro/inscription` (componente `src/components/ProSignup.tsx`): crea account (e-mail o Google), poi scrive practice, practitioner, servizi e orari direttamente da Supabase con le regole RLS. Il profilo nasce non pubblicato: per metterlo online imposta `practices.published = true` dalla tabella su Supabase. Per Google serve abilitare il provider in Supabase (vedi `src/lib/auth-client.ts`).
