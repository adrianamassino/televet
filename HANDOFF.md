# Televet — stato del progetto (passaggio di consegne)

Ultimo aggiornamento: 15 novembre 2026. Repository: `adrianamassino/televet` (ramo `main`).

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
Blog (strumenti di importazione da Wix + redirect 301), FAQ, pagine paese/servizio, scheda pubblica del veterinario, landing `/pro`, chat AI con archivio nell'area admin (`/admin/chats`), SEO (hreflang, JSON-LD, sitemap), migrazioni Supabase `0001`–`0006`, 29 test (`TZ=UTC npm test`), build che passa.

## Da fare (in ordine)
1. ~~Registrazione del veterinario~~ FATTA (prima versione): `/{lingua}/{paese}/pro/inscription` (account, attività, servizi e prezzi, orari, collegamento pagamenti). Il profilo nasce NON pubblicato (`practices.published = false`): va attivato a mano su Supabase finché non c'è un pannello di approvazione. Testi in fr/it/en/es (le altre lingue mostrano l'inglese). Da fare ancora: dashboard del veterinario per modificare profilo, ferie e agenda; collegamento Google Calendar; non provata con un Supabase reale.
2. Pagina di prenotazione per il proprietario (orario, dati dell'animale, pagamento). Il bottone "Prenota" delle schede compare solo con `BOOKING_URL`.
3. Home, risultati di ricerca, account del proprietario.
4. Connettori: Google Calendar, Vetup, VetIt, Petbooqz.
5. Script di importazione dal vecchio database AWS (servono export dello schema e accessi).
6. Verifiche: provare l'importazione del blog su Wix reale (`npm run import:blog -- --limit 3`), far rileggere le traduzioni pt/de/pl/nl, privacy policy e base giuridica della registrazione delle chat, riempire `toConfirm` in `facts.json` solo se le informazioni sono vere.

## Da sapere
- La pagina "Pro" dichiara che la registrazione della visita serve a una bozza di referto, con consenso, poi eliminata: va allineata a ciò che il prodotto fa davvero.
- Il test `ical` dipende dal fuso orario: usare `TZ=UTC`.
- Variabili d'ambiente: vedi `.env.example`. Servono Supabase (3 chiavi), `ANTHROPIC_API_KEY`, `ADMIN_EMAILS`, `APP_URL`, `CHAT_HASH_SECRET`, `CRON_SECRET`.
- Il modello usato è `claude-sonnet-5-5` (chat e bozza di referto).
