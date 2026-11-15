"use client";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

type Conv = { id: string; created_at: string; last_message_at: string; lang: string; country: string; page_path: string | null; audience: string; urgency: string; topic: string | null; message_count: number; status: string; cta_clicked: string[]; staff_note: string | null };
type Msg = { id: number; role: "user" | "assistant"; content: string; meta: { cta?: string[]; urgency?: string; failed?: boolean }; created_at: string };
const STATUS = ["new", "needs_followup", "handled", "archived"];
const fmt = (s: string) => new Date(s).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default function ChatsAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [authErr, setAuthErr] = useState("");
  const [items, setItems] = useState<Conv[]>([]);
  const [f, setF] = useState({ status: "", audience: "", urgency: "", q: "" });
  const [sel, setSel] = useState<{ conversation: Conv; messages: Msg[] } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => { setToken(data.session?.access_token ?? null); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setToken(s?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const r = await fetch(path, { ...init, headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}`, "content-type": "application/json" } });
    if (!r.ok) throw new Error(r.status === 403 ? "Accès réservé à l'équipe Televet." : `Erreur ${r.status}`);
    return r.json();
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setErr("");
    try { const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v)); setItems((await api(`/api/admin/chats?${p}`)).items); }
    catch (e) { setErr((e as Error).message); }
  }, [token, f, api]);
  useEffect(() => { load(); }, [load]);

  async function open(id: string) {
    try { const d = await api(`/api/admin/chats/${id}`); setSel(d); setNote(d.conversation.staff_note ?? ""); } catch (e) { setErr((e as Error).message); }
  }
  async function patch(body: object) {
    if (!sel) return;
    try { await api(`/api/admin/chats/${sel.conversation.id}`, { method: "PATCH", body: JSON.stringify(body) }); await open(sel.conversation.id); await load(); } catch (e) { setErr((e as Error).message); }
  }
  const transcript = () => sel ? sel.messages.map((m) => `[${fmt(m.created_at)}] ${m.role === "user" ? "Visiteur" : "Assistant"}: ${m.content}`).join("\n\n") : "";

  if (!ready) return null;
  if (!token) return (
    <form style={box} onSubmit={async (e) => { e.preventDefault(); setAuthErr(""); const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password: pw }); if (error) setAuthErr(error.message); }}>
      <h1>Admin — conversations</h1>
      <label>E-mail<input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
      <label>Mot de passe<input style={inp} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></label>
      <button style={btn}>Se connecter</button>{authErr && <p role="alert" style={{ color: "#b00020" }}>{authErr}</p>}
    </form>
  );

  return (
    <main style={{ fontFamily: "system-ui", padding: 16, display: "grid", gridTemplateColumns: sel ? "minmax(320px,1fr) minmax(320px,1fr)" : "1fr", gap: 16, alignItems: "start" }}>
      <section>
        <h1 style={{ marginTop: 0 }}>Conversations du chat</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input style={{ ...inp, width: 200 }} placeholder="Rechercher dans les messages" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Recherche" />
          <select style={inp} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Statut"><option value="">Tous statuts</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
          <select style={inp} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} aria-label="Type"><option value="">Tous publics</option><option value="owner">Propriétaires</option><option value="vet">Vétérinaires</option><option value="unknown">Inconnu</option></select>
          <select style={inp} value={f.urgency} onChange={(e) => setF({ ...f, urgency: e.target.value })} aria-label="Urgence"><option value="">Toutes urgences</option><option value="emergency">Urgence vitale</option><option value="urgent">Urgent</option><option value="none">Aucune</option></select>
        </div>
        {err && <p role="alert" style={{ color: "#b00020" }}>{err}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}><th>Dernier msg</th><th>Public</th><th>Sujet</th><th>Msgs</th><th>Urgence</th><th>RDV/inscr.</th><th>Statut</th></tr></thead>
          <tbody>{items.map((c) => (
            <tr key={c.id} onClick={() => open(c.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(c.id)} style={{ cursor: "pointer", borderBottom: "1px solid #eee", background: sel?.conversation.id === c.id ? "#eef2ff" : undefined }}>
              <td>{fmt(c.last_message_at)}</td><td>{c.audience}</td><td>{c.topic ?? "—"}</td><td>{c.message_count}</td>
              <td style={{ color: c.urgency === "emergency" ? "#b00020" : undefined, fontWeight: c.urgency === "none" ? 400 : 700 }}>{c.urgency === "none" ? "" : c.urgency}</td>
              <td>{c.cta_clicked.length ? "✓ " + c.cta_clicked.join(", ") : ""}</td><td>{c.status}</td>
            </tr>))}
          </tbody>
        </table>
        {!items.length && !err && <p>Aucune conversation.</p>}
      </section>
      {sel && (
        <aside style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, position: "sticky", top: 8, maxHeight: "calc(100vh - 16px)", overflow: "auto" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <b>{sel.conversation.topic ?? "Conversation"}</b><small>{sel.conversation.lang}-{sel.conversation.country} · {sel.conversation.page_path ?? ""}</small>
            <button style={{ ...btn, marginLeft: "auto" }} onClick={() => setSel(null)}>Fermer</button>
          </div>
          <div style={{ margin: "8px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select style={inp} value={sel.conversation.status} onChange={(e) => patch({ status: e.target.value })} aria-label="Changer le statut">{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
            <button style={btn} onClick={() => navigator.clipboard?.writeText(transcript())}>Copier la transcription</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sel.messages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "user" ? "#0b3bbf" : "#f1f4fb", color: m.role === "user" ? "#fff" : "#14213d", borderRadius: 12, padding: "8px 10px", whiteSpace: "pre-wrap" }}>
                {m.content}<div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{fmt(m.created_at)}{m.meta?.cta?.length ? ` · boutons: ${m.meta.cta.join(", ")}` : ""}{m.meta?.failed ? " · erreur IA" : ""}</div>
              </div>))}
          </div>
          <label style={{ display: "block", marginTop: 12 }}>Note interne<textarea style={{ ...inp, width: "100%", minHeight: 70 }} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button style={btn} onClick={() => patch({ staff_note: note || null })}>Enregistrer la note</button>
        </aside>
      )}
    </main>
  );
}
const box: React.CSSProperties = { fontFamily: "system-ui", maxWidth: 360, margin: "10vh auto", display: "grid", gap: 12, padding: 16 };
const inp: React.CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #c5cde0", borderRadius: 8, font: "inherit" };
const btn: React.CSSProperties = { padding: "8px 14px", border: 0, borderRadius: 8, background: "#0b3bbf", color: "#fff", fontWeight: 600, cursor: "pointer" };
