"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

/**
 * "Choose a new password" page: where the link of the password-reset e-mail lands (asked from the mobile apps' sign-in screen).
 * Supabase adds the recovery session to the address; the page then saves the new password.
 * Set-up: this address must be allowed in Supabase → Authentication → URL configuration → Redirect URLs.
 */
const T: Record<string, Record<string, string>> = {
  fr: { title: "Nouveau mot de passe", p: "Choisissez un nouveau mot de passe pour votre compte Televet.", pass: "Nouveau mot de passe (8 caractères minimum)", again: "Répétez le mot de passe", save: "Enregistrer", saving: "Un instant…", short: "Le mot de passe doit contenir au moins 8 caractères.", diff: "Les deux mots de passe ne sont pas identiques.", done: "Mot de passe modifié", doneP: "Vous pouvez revenir à l'application et vous connecter avec votre nouveau mot de passe.", bad: "Ce lien n'est plus valable. Demandez-en un nouveau depuis l'écran de connexion (« Mot de passe oublié ? »).", err: "Un problème est survenu : " },
  it: { title: "Nuova password", p: "Scegli una nuova password per il tuo account Televet.", pass: "Nuova password (minimo 8 caratteri)", again: "Ripeti la password", save: "Salva", saving: "Un momento…", short: "La password deve avere almeno 8 caratteri.", diff: "Le due password non coincidono.", done: "Password modificata", doneP: "Puoi tornare all'app e accedere con la nuova password.", bad: "Questo link non è più valido. Chiedine uno nuovo dalla schermata di accesso («Password dimenticata?»).", err: "Si è verificato un problema: " },
  en: { title: "New password", p: "Choose a new password for your Televet account.", pass: "New password (8 characters minimum)", again: "Repeat the password", save: "Save", saving: "One moment…", short: "The password must be at least 8 characters long.", diff: "The two passwords don't match.", done: "Password changed", doneP: "You can go back to the app and sign in with your new password.", bad: "This link is no longer valid. Ask for a new one from the sign-in screen (\"Forgot your password?\").", err: "Something went wrong: " },
  es: { title: "Nueva contraseña", p: "Elige una nueva contraseña para tu cuenta de Televet.", pass: "Nueva contraseña (mínimo 8 caracteres)", again: "Repite la contraseña", save: "Guardar", saving: "Un momento…", short: "La contraseña debe tener al menos 8 caracteres.", diff: "Las dos contraseñas no coinciden.", done: "Contraseña cambiada", doneP: "Puedes volver a la app y entrar con tu nueva contraseña.", bad: "Este enlace ya no es válido. Pide uno nuevo desde la pantalla de acceso («¿Olvidaste tu contraseña?»).", err: "Hubo un problema: " },
};
const field: React.CSSProperties = { width: "100%", minHeight: 50, borderRadius: 14, border: "1.5px solid #dce8fb", padding: "0 14px", font: "16px var(--body)", color: "#16275f", boxSizing: "border-box" };
const label: React.CSSProperties = { display: "block", margin: "14px 0 6px", font: "500 14px var(--body)", color: "#16275f" };

export default function ResetPassword() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [lang, setLang] = useState("en"), [state, setState] = useState<"wait" | "form" | "bad" | "done">("wait");
  const [a, setA] = useState(""), [b, setB] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search), h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const l = (q.get("lang") ?? navigator.language ?? "en").slice(0, 2).toLowerCase(); setLang(T[l] ? l : "en");
    if (h.get("error") || q.get("error")) { setState("bad"); return; }
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => { if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) setState((s) => (s === "done" ? s : "form")); });
    // the recovery session is read from the address a moment after the page opens; with no session after a while the link is not usable
    const timer = setTimeout(() => sb.auth.getSession().then(({ data }) => setState((s) => (s !== "wait" ? s : data.session ? "form" : "bad"))), 2500);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, [sb]);
  const t = T[lang];
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    if (a.length < 8) return setMsg(t.short);
    if (a !== b) return setMsg(t.diff);
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: a });
    setBusy(false);
    if (error) return setMsg(t.err + error.message);
    await sb.auth.signOut().catch(() => {}); // the recovery session has done its job
    setState("done");
  }
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a2a9c 0%,#0a3fd6 30%,#1e7bff 62%,#22b8ea 86%,#3fd9c9 110%)", padding: "28px 16px 40px", fontFamily: "var(--body)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <p style={{ textAlign: "center", margin: 0 }}><img src="/logo-white.svg" alt="Televet" style={{ height: 34, width: "auto" }} /></p>
      <section style={{ maxWidth: 460, margin: "22px auto 0", background: "#fff", borderRadius: 26, padding: 24, boxShadow: "0 30px 60px -30px rgba(4,16,70,.7)" }}>
        <h1 style={{ margin: "0 0 10px", color: "#0b1f5c", font: "700 24px/1.2 var(--display)" }}>{state === "done" ? t.done : t.title}</h1>
        {state === "wait" && <p style={{ color: "#4a5a8a" }}>…</p>}
        {state === "bad" && <p role="alert" style={{ color: "#b3261e", maxWidth: "none" }}>{t.bad}</p>}
        {state === "done" && <p style={{ color: "#4a5a8a", maxWidth: "none" }}>{t.doneP}</p>}
        {state === "form" && (
          <form onSubmit={save}>
            <p style={{ color: "#4a5a8a", margin: 0, maxWidth: "none" }}>{t.p}</p>
            <label style={label} htmlFor="np1">{t.pass}</label><input id="np1" style={field} type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} />
            <label style={label} htmlFor="np2">{t.again}</label><input id="np2" style={field} type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} />
            {msg && <p role="alert" style={{ color: "#b3261e", fontSize: 15, margin: "12px 0 0", maxWidth: "none" }}>{msg}</p>}
            <button disabled={busy} style={{ width: "100%", minHeight: 52, marginTop: 18, border: 0, borderRadius: 999, background: "linear-gradient(135deg,#0a2a9c,#0a3fd6 55%,#1e7bff)", color: "#fff", font: "600 17px var(--body)", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? t.saving : t.save}</button>
          </form>
        )}
      </section>
    </main>
  );
}
