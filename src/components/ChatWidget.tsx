"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Cta = { key: string; label: string; url: string };
type Msg = { role: "user" | "assistant"; text: string; ctas?: Cta[] };

const T: Record<string, Record<string, string | string[]>> = {
  fr: { title: "Assistant Televet", ai: "IA", notice: "Je suis une IA, pas un vétérinaire. Televet garde la conversation pour mieux vous aider et améliorer le service : évitez de partager des données personnelles sensibles.", welcome: "Bonjour, moi c'est l'assistant de Televet 🐾 Dites-moi ce qui se passe : un souci avec votre animal, une question sur le site, ou vous êtes vétérinaire ? On regarde ça ensemble, tranquillement.", chips: ["Mon animal ne va pas bien", "Je voudrais parler à un vétérinaire", "Je suis vétérinaire"], emergency: "Urgence vitale ? Contactez immédiatement un vétérinaire d'urgence.", ph: "Écrivez votre message…", send: "Envoyer", open: "Ouvrir le chat", close: "Fermer", err: "Une erreur est survenue. Réessayez dans un instant.", rate: "Trop de messages, réessayez plus tard ou écrivez à contact@televet.co.", fab: "Une question ?" },
  it: { title: "Assistente Televet", ai: "IA", notice: "Sono un'IA, non un veterinario. Televet conserva la conversazione per aiutarti meglio e migliorare il servizio: evita di condividere dati personali sensibili.", welcome: "Ciao, sono l'assistente di Televet 🐾 Raccontami cosa sta succedendo: un problema con il tuo animale, una domanda sul sito, oppure sei un veterinario? Vediamo insieme, con calma.", chips: ["Il mio animale non sta bene", "Vorrei parlare con un veterinario", "Sono un veterinario"], emergency: "Emergenza? Contatta subito un veterinario di pronto soccorso.", ph: "Scrivi il tuo messaggio…", send: "Invia", open: "Apri la chat", close: "Chiudi", err: "Si è verificato un errore. Riprova tra poco.", rate: "Troppi messaggi, riprova più tardi o scrivi a contact@televet.co.", fab: "Una domanda?" },
  en: { title: "Televet assistant", ai: "AI", notice: "I'm an AI, not a vet. Televet keeps this chat to help you better and improve the service, so please avoid sharing sensitive personal details.", welcome: "Hi, I'm the Televet assistant 🐾 Tell me what's going on: something with your pet, a question about the site, or are you a vet? Let's figure it out together, no rush.", chips: ["My pet isn't doing well", "I'd like to talk to a vet", "I'm a vet"], emergency: "Life-threatening emergency? Contact an emergency vet immediately.", ph: "Type your message…", send: "Send", open: "Open chat", close: "Close", err: "Something went wrong. Please try again in a moment.", rate: "Too many messages, please try later or write to contact@televet.co.", fab: "Any question?" },
  es: { title: "Asistente Televet", ai: "IA", notice: "Soy una IA, no un veterinario. Televet guarda la conversación para ayudarte mejor y mejorar el servicio: evita compartir datos personales sensibles.", welcome: "Hola, soy el asistente de Televet 🐾 Cuéntame qué pasa: algo con tu mascota, una duda sobre el sitio, o ¿eres veterinario? Lo vemos juntos, con calma.", chips: ["Mi mascota no está bien", "Quiero hablar con un veterinario", "Soy veterinario"], emergency: "¿Emergencia vital? Contacta de inmediato con un veterinario de urgencias.", ph: "Escribe tu mensaje…", send: "Enviar", open: "Abrir el chat", close: "Cerrar", err: "Ha ocurrido un error. Inténtalo de nuevo en un momento.", rate: "Demasiados mensajes, inténtalo más tarde o escribe a contact@televet.co.", fab: "¿Una pregunta?" },
  pt: { title: "Assistente Televet", ai: "IA", notice: "Sou uma IA, não um veterinário. A Televet guarda a conversa para o ajudar melhor e melhorar o serviço: evite partilhar dados pessoais sensíveis.", welcome: "Olá, sou o assistente da Televet 🐾 Conte-me o que se passa: um problema com o seu animal, uma dúvida sobre o site, ou é veterinário? Vemos isto juntos, com calma.", chips: ["O meu animal não está bem", "Gostava de falar com um veterinário", "Sou veterinário"], emergency: "Emergência com risco de vida? Contacte de imediato um veterinário de urgência.", ph: "Escreva a sua mensagem…", send: "Enviar", open: "Abrir o chat", close: "Fechar", err: "Ocorreu um erro. Tente novamente daqui a pouco.", rate: "Demasiadas mensagens, tente mais tarde ou escreva para contact@televet.co.", fab: "Tem uma dúvida?" },
  de: { title: "Televet-Assistent", ai: "KI", notice: "Ich bin eine KI, kein Tierarzt. Televet speichert das Gespräch, um dir besser zu helfen und den Service zu verbessern – bitte teile keine sensiblen persönlichen Daten.", welcome: "Hallo, ich bin der Assistent von Televet 🐾 Erzähl mir, was los ist: ein Problem mit deinem Tier, eine Frage zur Website – oder bist du Tierarzt? Wir schauen uns das gemeinsam an, ganz in Ruhe.", chips: ["Meinem Tier geht es nicht gut", "Ich möchte mit einem Tierarzt sprechen", "Ich bin Tierarzt"], emergency: "Lebensgefahr? Wende dich sofort an einen tierärztlichen Notdienst.", ph: "Schreib deine Nachricht…", send: "Senden", open: "Chat öffnen", close: "Schließen", err: "Etwas ist schiefgelaufen. Versuch es gleich noch einmal.", rate: "Zu viele Nachrichten, versuch es später noch einmal oder schreib an contact@televet.co.", fab: "Eine Frage?" },
  pl: { title: "Asystent Televet", ai: "AI", notice: "Jestem sztuczną inteligencją, nie weterynarzem. Televet zachowuje tę rozmowę, aby lepiej Ci pomagać i ulepszać usługę – nie podawaj wrażliwych danych osobowych.", welcome: "Cześć, jestem asystentem Televet 🐾 Opowiedz, co się dzieje: problem ze zwierzakiem, pytanie o stronę, a może jesteś weterynarzem? Spokojnie wszystko razem sprawdzimy.", chips: ["Mojemu zwierzakowi coś dolega", "Chcę porozmawiać z weterynarzem", "Jestem weterynarzem"], emergency: "Zagrożone życie? Natychmiast skontaktuj się z weterynarzem dyżurnym.", ph: "Napisz wiadomość…", send: "Wyślij", open: "Otwórz czat", close: "Zamknij", err: "Coś poszło nie tak. Spróbuj za chwilę.", rate: "Zbyt wiele wiadomości – spróbuj później lub napisz na contact@televet.co.", fab: "Masz pytanie?" },
  nl: { title: "Televet-assistent", ai: "AI", notice: "Ik ben een AI, geen dierenarts. Televet bewaart dit gesprek om je beter te helpen en de dienst te verbeteren; deel liever geen gevoelige persoonsgegevens.", welcome: "Hoi, ik ben de assistent van Televet 🐾 Vertel me wat er aan de hand is: iets met je dier, een vraag over de site, of ben je dierenarts? We kijken er samen rustig naar.", chips: ["Mijn dier voelt zich niet goed", "Ik wil met een dierenarts praten", "Ik ben dierenarts"], emergency: "Levensbedreigend? Neem meteen contact op met een spoeddierenarts.", ph: "Typ je bericht…", send: "Verstuur", open: "Chat openen", close: "Sluiten", err: "Er ging iets mis. Probeer het zo nog eens.", rate: "Te veel berichten, probeer het later of mail contact@televet.co.", fab: "Een vraag?" },
};
const KEY = "televet_chat_v1";
const HIDDEN = /^\/(admin|visio|auth|api)(\/|$)/;

const CSS = `
.tvc-fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#0b3bbf;color:#fff;font:600 15px system-ui,sans-serif;padding:13px 18px;cursor:pointer;box-shadow:0 6px 24px rgba(11,59,191,.35)}
.tvc-fab:focus-visible,.tvc-send:focus-visible,.tvc-x:focus-visible,.tvc-chip:focus-visible,.tvc-cta:focus-visible{outline:3px solid #ffb703;outline-offset:2px}
.tvc-panel{position:fixed;right:16px;bottom:16px;z-index:2147483001;width:380px;max-width:calc(100vw - 32px);height:min(640px,calc(100dvh - 32px));display:flex;flex-direction:column;background:#fff;color:#14213d;border-radius:16px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.28);font:15px/1.45 system-ui,sans-serif}
@media(max-width:520px){.tvc-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0}}
.tvc-head{display:flex;align-items:center;gap:8px;background:#0b3bbf;color:#fff;padding:12px 14px}
.tvc-head b{font-size:16px}.tvc-badge{background:rgba(255,255,255,.2);border-radius:6px;font-size:11px;padding:2px 6px;font-weight:700}
.tvc-x{margin-left:auto;background:transparent;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:4px 8px}
.tvc-notice{font-size:12px;color:#4a5568;background:#f1f4fb;padding:8px 14px;border-bottom:1px solid #e3e8f4}
.tvc-sos{background:#b00020;color:#fff;font-weight:600;font-size:13px;padding:8px 14px}
.tvc-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#fafbff}
.tvc-m{max-width:86%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}
.tvc-m.a{align-self:flex-start;background:#fff;border:1px solid #e3e8f4}.tvc-m.u{align-self:flex-end;background:#0b3bbf;color:#fff}
.tvc-ctas{display:flex;flex-direction:column;gap:6px;align-self:flex-start;max-width:86%}
.tvc-cta{display:block;text-align:center;text-decoration:none;background:#ffb703;color:#14213d;font-weight:700;border-radius:10px;padding:10px 12px}
.tvc-cta.s{background:#fff;border:1px solid #0b3bbf;color:#0b3bbf}
.tvc-chips{display:flex;flex-wrap:wrap;gap:6px}.tvc-chip{border:1px solid #0b3bbf;color:#0b3bbf;background:#fff;border-radius:999px;padding:7px 12px;cursor:pointer;font:inherit;font-size:14px}
.tvc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e3e8f4;background:#fff}
.tvc-form input{flex:1;min-width:0;border:1px solid #c5cde0;border-radius:10px;padding:10px 12px;font:inherit}
.tvc-send{border:0;background:#0b3bbf;color:#fff;border-radius:10px;padding:0 16px;font-weight:700;cursor:pointer}.tvc-send:disabled{opacity:.5;cursor:default}
.tvc-dots{align-self:flex-start;color:#6b7690;padding:4px 8px}
@media(prefers-reduced-motion:no-preference){.tvc-dots{animation:tvcp 1s infinite}@keyframes tvcp{50%{opacity:.35}}}
`;

export default function ChatWidget() {
  const path = usePathname() || "/";
  const m = path.match(/^\/([a-z]{2})\/([a-z]{2})(\/|$)/i);
  // pages without /{lang}/{country}/ (home): interface language from the browser, country decided by the server (IP)
  const [nav, setNav] = useState("");
  useEffect(() => { setNav((navigator.language || "").slice(0, 2).toLowerCase()); }, []);
  const lang = m ? m[1].toLowerCase() : T[nav] ? nav : "en", country = m ? m[2].toUpperCase() : "";
  const t = T[lang] ?? T.en;

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sos, setSos] = useState(false);
  const convId = useRef<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { try { convId.current = localStorage.getItem(KEY); } catch { /* storage unavailable */ } }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc);
  }, [open]);
  if (HIDDEN.test(path)) return null;

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || busy) return;
    setText(""); setBusy(true);
    setMsgs((x) => [...x, { role: "user", text: message }]);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId: convId.current ?? undefined, message, lang, country, page: path, localized: !!m }) });
      if (r.status === 429) { setMsgs((x) => [...x, { role: "assistant", text: String(t.rate) }]); return; }
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as { conversationId: string; reply: string; ctas: Cta[]; urgency: string };
      convId.current = d.conversationId;
      try { localStorage.setItem(KEY, d.conversationId); } catch { /* ignore */ }
      if (d.urgency === "emergency") setSos(true);
      setMsgs((x) => [...x, { role: "assistant", text: d.reply, ctas: d.ctas }]);
    } catch { setMsgs((x) => [...x, { role: "assistant", text: String(t.err) }]); }
    finally { setBusy(false); }
  }
  const clicked = (key: string) => {
    if (!convId.current) return;
    fetch("/api/chat/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ conversationId: convId.current, key }), keepalive: true }).catch(() => {});
  };

  return (
    <>
      <style>{CSS}</style>
      {!open && <button className="tvc-fab" aria-label={String(t.open)} onClick={() => setOpen(true)}><span aria-hidden>💬</span>{t.fab}</button>}
      {open && (
        <section className="tvc-panel" role="dialog" aria-label={String(t.title)}>
          <div className="tvc-head"><b>{t.title}</b><span className="tvc-badge">{t.ai}</span><button className="tvc-x" aria-label={String(t.close)} onClick={() => setOpen(false)}>×</button></div>
          <div className="tvc-notice">{t.notice}</div>
          {sos && <div className="tvc-sos" role="alert">{t.emergency}</div>}
          <div className="tvc-msgs" aria-live="polite">
            <div className="tvc-m a">{t.welcome}</div>
            {msgs.length === 0 && <div className="tvc-chips">{(t.chips as string[]).map((c) => <button key={c} className="tvc-chip" onClick={() => send(c)}>{c}</button>)}</div>}
            {msgs.map((x, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className={`tvc-m ${x.role === "user" ? "u" : "a"}`}>{x.text}</div>
                {x.ctas && x.ctas.length > 0 && (
                  <div className="tvc-ctas">{x.ctas.map((c, j) => (
                    <a key={c.key} className={`tvc-cta${j ? " s" : ""}`} href={c.url} onClick={() => clicked(c.key)}>{c.label}</a>
                  ))}</div>
                )}
              </div>
            ))}
            {busy && <div className="tvc-dots" aria-hidden>…</div>}
            <div ref={end} />
          </div>
          <form className="tvc-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={String(t.ph)} maxLength={1000} aria-label={String(t.ph)} />
            <button className="tvc-send" disabled={busy || !text.trim()}>{t.send}</button>
          </form>
        </section>
      )}
    </>
  );
}
