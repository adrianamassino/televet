"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

const C: Record<string, Record<string, string>> = {
  fr: { join: "Rejoindre la visio", early: "La salle ouvre le {t}.", closed: "La téléconsultation est terminée.", notConfirmed: "Rendez-vous non confirmé.", err: "Impossible d'ouvrir la visio. Réessayez." },
  it: { join: "Entra nel video", early: "La stanza apre il {t}.", closed: "La videoconsulenza è terminata.", notConfirmed: "Appuntamento non confermato.", err: "Impossibile aprire il video. Riprova." },
  en: { join: "Join the video call", early: "The room opens on {t}.", closed: "The video consultation has ended.", notConfirmed: "Appointment not confirmed.", err: "Couldn't open the video call. Try again." },
  es: { join: "Entrar a la videollamada", early: "La sala abre el {t}.", closed: "La videoconsulta ha terminado.", notConfirmed: "Cita no confirmada.", err: "No se pudo abrir la videollamada. Inténtalo de nuevo." },
};

/** Opens the video room for a booking (owner or vet, signed in). Shows when the room opens if it is too early. */
export default function JoinVideo({ bookingId, lang }: { bookingId: string; lang: string }) {
  const t = C[lang] ?? C.en;
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setMsg("");
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const r = await fetch(`/api/bookings/${bookingId}/video`, { headers: { authorization: `Bearer ${data.session?.access_token}` } });
      const j = (await r.json()) as { ok?: boolean; url?: string; reason?: string; opensAt?: string };
      if (j.ok && j.url) { window.location.href = j.url; return; }
      if (j.reason === "too_early" && j.opensAt) setMsg(t.early.replace("{t}", new Intl.DateTimeFormat(lang, { dateStyle: "full", timeStyle: "short" }).format(new Date(j.opensAt))));
      else setMsg(j.reason === "closed" ? t.closed : j.reason === "not_confirmed" ? t.notConfirmed : t.err);
    } catch { setMsg(t.err); } finally { setBusy(false); }
  }
  return <span><button className="btn btn-ghost" disabled={busy} onClick={go}>{t.join}</button>{msg && <small role="status" style={{ display: "block", marginTop: 4 }}>{msg}</small>}</span>;
}
