# Televet — app iOS e Android

Un solo progetto (Expo SDK 58, React Native, TypeScript) che produce **due app**:

| App | Per chi | `APP_VARIANT` | Identificativo |
| --- | --- | --- | --- |
| **Televet** | proprietari di animali | `owner` (predefinito) | `co.televet.app` |
| **Televet Pro** | veterinari e cliniche | `vet` | `co.televet.pro` |

Le app non hanno un server proprio: usano le API del sito Televet (`../src/app/api`) e lo stesso database Supabase.
All'avvio leggono indirizzo e chiave pubblica del database da `GET /api/app/config`, quindi l'unica impostazione
di build è l'indirizzo del sito (`extra.apiUrl` in `app.config.ts`, oggi `https://televet.netlify.app`).

## Cosa fanno

**Televet (proprietari)** — cerca veterinari per paese, città e tipo di visita · scheda della clinica con servizi e prezzi ·
prenotazione (orario → animale e motivo → pagamento) · appuntamenti con pulsante per il videoconsulto e annullamento delle
richieste non ancora accettate · animali e libretto sanitario (foto, lettura sul telefono, scadenze, promemoria) ·
profilo, lingua, paese, eliminazione dell'account.

**Televet Pro (veterinari)** — agenda dei prossimi giorni · richieste da accettare o rifiutare · scheda dell'appuntamento
(cliente, animale, indirizzo con itinerario, pagamento, video) · clienti · link di prenotazione da condividere.
Orari, prezzi, équipe e pagamenti restano nello spazio web.

Lingue: italiano, francese, inglese, spagnolo (`src/copy/index.ts`, un solo file).

## Come è fatto

```
app.config.ts        nome, icona, identificativo secondo APP_VARIANT
src/app/             schermate (Expo Router): login · paid · o/… (proprietari) · v/… (veterinari)
src/components/      interfaccia condivisa (ui.tsx, Backdrop, Screen, Confirm, Settings, BookletReader)
src/lib/             config, boot, supabase, api, session, i18n, push, formati, tipi
src/copy/            tutti i testi nelle 4 lingue
assets/              icone, logo, foto (rigenerabili con `npm run assets`)
scripts/preview.cjs  fotografa le schermate in un browser con dati di esempio
```

Scelte da conoscere:

- **Pagamento**: il sito crea la prenotazione e il pagamento; l'app apre la pagina `/m/pay` del sito in un foglio del
  browser e torna nell'app con il link `televet://paid`. Nessun modulo nativo di pagamento da mantenere.
- **Lettura del libretto**: gratuita e sul telefono. Una vista web invisibile carica `/m/ocr` del sito (Tesseract.js, lo
  stesso lettore del sito) e riceve la foto dall'app; la foto non viene caricata da quella pagina.
- **Notifiche**: Expo Notifications. Il telefono si registra con `POST /api/app/push-token`; il sito invia con
  `src/lib/push.ts`. Serve l'identificativo del progetto Expo (`EAS_PROJECT_IDS` in `app.config.ts`).
- **Videoconsulto**: la stanza si apre nel browser interno all'app.

## Comandi

```bash
npm install
npm run typecheck          # controllo dei tipi
npm run check:native       # compila i bundle iOS e Android (senza Xcode / Android Studio)
npm run export:web:owner   # versione web di prova dell'app proprietari → dist-web-owner
npm run export:web:vet     # idem per l'app veterinari → dist-web-vet
SHOTS='[{"name":"home","path":"/o"}]' node scripts/preview.cjs dist-web-owner shots   # screenshot con dati di esempio
npm start                  # sviluppo (app proprietari);  npm run start:vet  per Televet Pro
```

Passando da una variante all'altra sullo stesso computer usare sempre `--clear` (gli script lo fanno già): senza,
il bundler riusa la configurazione dell'altra app.

I test delle funzioni pure (date, formati, testi nelle 4 lingue) sono in `../tests/mobile.test.ts` e girano con `npm test`
nella cartella principale.

## Pubblicazione (EAS)

Servono: account Expo, Apple Developer Program, Google Play Console.

```bash
npx eas-cli@latest login
APP_VARIANT=owner npx eas-cli@latest init     # crea il progetto Expo "televet": copiare l'id in EAS_PROJECT_IDS.owner
APP_VARIANT=vet   npx eas-cli@latest init     # crea "televet-pro": copiare l'id in EAS_PROJECT_IDS.vet
npx eas-cli@latest build --profile owner --platform all     # oppure --profile vet
npx eas-cli@latest submit --profile owner --platform all
```

`owner-preview` / `vet-preview` producono build di prova da installare direttamente (APK su Android).

Prima dell'invio agli store: account di prova per i revisori (uno per app), indirizzo della privacy policy,
schermate, e in Supabase → Authentication → URL configuration l'indirizzo `https://<sito>/**` tra i Redirect URLs
(serve per «Password dimenticata»).

## Dipendenze

Le versioni dei moduli nativi sono quelle previste da Expo SDK 58 (`node_modules/expo/bundledNativeModules.json`).
Per aggiungerne o aggiornarle usare `npx expo install <pacchetto>`, non `npm install`.
