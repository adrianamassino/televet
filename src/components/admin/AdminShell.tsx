"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/auth-client";

type Api = <T = any>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>;
const Ctx = createContext<{ api: Api; email: string }>({ api: async () => { throw new Error("no auth"); }, email: "" });
export const useAdmin = () => useContext(Ctx);

const NAV: [string, string][] = [["/admin", "Panoramica"], ["/admin/practices", "Cliniche e veterinari"], ["/admin/vets", "Veterinari"], ["/admin/bookings", "Appuntamenti"], ["/admin/reviews", "Valutazioni"], ["/admin/users", "Iscritti"], ["/admin/chats", "Chat"], ["/admin/settings", "Commissioni e registro"]];

export function AdminShell({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null), [email, setEmail] = useState(""), [ready, setReady] = useState(false);
  const [em, setEm] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState(""), [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => { setToken(data.session?.access_token ?? null); setEmail(data.session?.user.email ?? ""); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { setToken(s?.access_token ?? null); setEmail(s?.user.email ?? ""); });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => setOpen(false), [path]);
  const api = useCallback<Api>(async (p, init) => {
    const r = await fetch(p, { method: init?.method ?? "GET", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: init?.body === undefined ? undefined : JSON.stringify(init.body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(r.status === 403 ? "Accesso riservato al team Televet." : (() => { const e = j as { error?: string; detail?: string }; return e.detail ? `${e.error}: ${e.detail}` : e.error ?? `Errore ${r.status}`; })());
    return j;
  }, [token]);
  const value = useMemo(() => ({ api, email }), [api, email]);

  if (!ready) return <div className="adm" />;
  if (!token) return (
    <div className="adm adm-login">
      <form onSubmit={async (e) => { e.preventDefault(); setErr(""); const { error } = await supabaseBrowser().auth.signInWithPassword({ email: em, password: pw }); if (error) setErr("E-mail o password non corretti."); }}>
        <img src="/logo.svg" alt="Televet" height={36} />
        <h1>Admin Televet</h1>
        <label>E-mail<input type="email" value={em} onChange={(e) => setEm(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></label>
        <button className="adm-btn primary">Accedi</button>
        {err && <p role="alert" className="adm-err">{err}</p>}
      </form>
    </div>
  );
  return (
    <Ctx.Provider value={value}>
      <div className="adm">
        <aside className={open ? "open" : ""}>
          <a href="/admin" className="adm-brand"><img src="/logo-white.svg" alt="Televet" height={28} /><span>Admin</span></a>
          <nav aria-label="Admin">{NAV.map(([h, l]) => <a key={h} href={h} aria-current={(h === "/admin" ? path === h : path.startsWith(h)) ? "page" : undefined}>{l}</a>)}</nav>
          <div className="adm-me"><span>{email}</span><button className="adm-link" onClick={() => supabaseBrowser().auth.signOut()}>Esci</button></div>
        </aside>
        <main>
          <button className="adm-burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
          {children}
        </main>
      </div>
    </Ctx.Provider>
  );
}
