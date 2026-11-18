# Televet — stato del progetto (passaggio di consegne)

Ultimo aggiornamento: 18 novembre 2026. Repository: `adrianamassino/televet` (ramo `main`).

## Cos'è
Nuova piattaforma Televet (Next.js 15 + Supabase) che sostituirà il sito Wix televet.co e, col tempo, il vecchio app.televet.co (AWS). Fondatrice: Adriana (scrive in italiano). Mercati: Francia, Italia, Spagna, Portogallo, Germania, ecc. (17 paesi in `src/lib/countries.ts`), 8 lingue di interfaccia (fr, it, en, es, pt, de, pl, nl).

## Decisioni prese
- **Non si migra ancora.** Il sito Wix resta online finché Adriana non ha finito e verificato tutto.
- **Hosting previsto:** Netlify (piano gratuito, da verificare per uso commerciale); alternative Vercel Pro o Railway. Il progetto è Next.js standard, senza dipendenze da Vercel.
- **Cron:** su GitHub Actions (`.github/workflows/cron.yml`), che chiama `/api/cron/*` con `CRON_SECRET`. `vercel.json` serve solo su Vercel.
- **Chatbot:** il modello emette solo chiavi CTA, il server le traduce in URL ammessi; mai URL né prezzi nel testo; tono caldo e colloquiale; riconoscimento delle emergenze lato server. Fatti modificabili in `content/chat/facts.json`.
- **Telemedicina:** i veterinari in video rispondono in tutto il paese, quindi esistono pagine a livello di paese (`/{lingua}/{paese}/{servizio}`) senza città.
- **Prezzi:** il sito non annuncia prezzi; ogni veterinario fissa i propri e li mostra solo sulla propria scheda.

## Fatto
Blog (strumenti di importazione da Wix + redirect 301), FAQ, pagine paese/servizio, scheda pubblica del veterinario, landing `/pro`, chat AI con archivio nell'area admin (`/admin/chats`), SEO (hreflang, JSON-LD, sitemap), migrazioni Supabase `0001`–`0008`, 29 test (`TZ=UTC npm test`), build che passa.

## Regole di business decise
- Le prenotazioni si confermano automaticamente (`practices.auto_confirm`, default vero) quando il pagamento è autorizzato/incassato o non è online; il veterinario può disattivarlo nel profilo e confermare/rifiutare a mano. Con Stripe l'addebito parte alla conferma.
- Il veterinario non può pubblicare da solo il profilo né cambiare commissioni o stato pagamenti: lo impedisce un trigger nel database (migrazione `0007`). Per pubblicare: `practices.published = true` su Supabase.

## Design (stato al 18 novembre 2026) — leggere prima di toccare la grafica
Adriana ha bocciato in ordine: troppo semplice → troppo colorato/arlecchino → blu puro → verde acqua ("brutto") → bottone giallo. Direzione scelta: **stile "medical background" blu**, mix navy + blu cielo/ciano, con più contrasto tra blu scuro e blu chiaro, un po' vibrante. Ha mandato come riferimento immagini di sfondi medicali (blu elettrico→ciano, esagoni/molecole, croci di vetro trasparenti, cuore, scudi, goccia, linea del battito luminosa, low-poly, onde con icone tonde).
Regole che ha dato:
- Niente "8000 card colorate": le card restano bianche e sobrie, il colore sta in sfondo, testate, fasce e piccoli quadratini icona (blu).
- Gradienti soprattutto nello sfondo e nelle testate; niente arcobaleno, niente verde acqua, niente giallo/viola come accenti.
- Bottone principale sulla testata: **bianco** con testo blu scuro (`.btn-sun`); gli altri bottoni gradiente blu→ciano.
- Immagini dietro la testata: "troppo pesanti" → tenerle leggere (opacità ~0.55, sfumate a sinistra dove c'è il testo). Mai icone dietro i paragrafi.
- Serve anche tema animali/veterinario (cani, gatti, conigli, uccelli, pesci, zampe, ossa, stetoscopio, siringa), non solo croci: ora ci sono come disegni al tratto (lucide-react) nei file `public/decor/`.
Dove sta il codice: `src/app/globals.css` è a strati (v1…v12; i blocchi in fondo vincono). Decorazioni SVG in `public/decor/` (`hero.svg`, `facets.svg`, `waves.svg`, `page.svg`, `hex.svg`, `crosses.svg`, `ecg.svg`) usate da `.hero-panel::before`, `.band::before`, `.site-footer::before`, `body`. Possibile ripulire il CSS unificando gli strati.
Ancora da fare sul design: applicare lo stesso stile a registrazione, prenotazione, profilo veterinario, FAQ/blog/elenco città e verificare la dashboard con dati reali (finora solo la pagina `/pro` è stata vista in screenshot; la dashboard richiede Supabase). Screenshot: Playwright contro `next start -p 3100` con variabili Supabase finte.

## Da fare (in ordine)
1. ~~Registrazione del veterinario~~ FATTA (prima versione): `/{lingua}/{paese}/pro/inscription` (account, attività, servizi e prezzi, orari, collegamento pagamenti). Il profilo nasce NON pubblicato (`practices.published = false`): va attivato a mano su Supabase finché non c'è un pannello di approvazione. Testi in fr/it/en/es/pl (le altre lingue mostrano l'inglese). Da fare ancora: dashboard del veterinario per modificare profilo, ferie e agenda; collegamento Google Calendar; non provata con un Supabase reale.
2. ~~Pagina di prenotazione~~ FATTA (prima versione): `/{lingua}/{paese}/reserver/{slug}`, testi fr/it/en/es/pl. Non provata con Supabase e Stripe reali; manca ancora la pagina per il veterinario che conferma/rifiuta (le API ci sono già) e il ritorno dopo il pagamento Mercado Pago.
3. ~~Dashboard veterinario~~ FATTA con tutte le funzioni del vecchio app (clinica con foto, veterinari con foto/info/orari/consultazioni/congedi/link visio, widget di prenotazione on/off, Google Calendar, token Vetup/VetIt/Petbooqz, Stripe/Mercado Pago, promemoria e-mail) + appuntamenti. Migrazione `0008` richiesta. Le integrazioni Vetup/VetIt/Petbooqz salvano il token ma la sincronizzazione parte solo quando si implementa `src/lib/calendar/pims.ts` con la documentazione dei partner. Design system in `src/app/globals.css` (cobalto, Bricolage Grotesque + Figtree). Prima versione: `/{lingua}/{paese}/pro/dashboard` (appuntamenti con accetta/rifiuta, profilo, consultazioni e prezzi, orari, pagamenti, link calendario iCal). Manca il collegamento Google Calendar dal pannello e le ferie/blocchi.
3b. Home, risultati di ricerca, account del proprietario (storico appuntamenti, animali).
4. Connettori: Google Calendar, Vetup, VetIt, Petbooqz.
5. Script di importazione dal vecchio database AWS (servono export dello schema e accessi).
6. Verifiche: provare l'importazione del blog su Wix reale (`npm run import:blog -- --limit 3`), far rileggere le traduzioni pt/de/pl/nl, privacy policy e base giuridica della registrazione delle chat, riempire `toConfirm` in `facts.json` solo se le informazioni sono vere.

## Da sapere
- La pagina "Pro" dichiara che la registrazione della visita serve a una bozza di referto, con consenso, poi eliminata: va allineata a ciò che il prodotto fa davvero.
- Il test `ical` dipende dal fuso orario: usare `TZ=UTC`.
- Variabili d'ambiente: vedi `.env.example`. Servono Supabase (3 chiavi), `ANTHROPIC_API_KEY`, `ADMIN_EMAILS`, `APP_URL`, `CHAT_HASH_SECRET`, `CRON_SECRET`.
- Il modello usato è `claude-sonnet-5-5` (chat e bozza di referto).
