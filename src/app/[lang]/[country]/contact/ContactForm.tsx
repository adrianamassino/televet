"use client";
import { useState } from "react";

type C = { name: string; email: string; topic: string; topics: string[]; msg: string; send: string; sending: string; ok: string; err: string };

export function ContactForm({ c, lang }: { c: C; lang: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), email: f.get("email"), topic: f.get("topic"), message: f.get("message"), website: f.get("website"), lang }) });
      setState(r.ok ? "ok" : "err");
      if (r.ok) e.currentTarget.reset();
    } catch { setState("err"); }
  }
  return (
    <form className="tv-form" onSubmit={submit} noValidate={false}>
      <label>{c.name}<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>{c.email}<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label>{c.topic}<select name="topic">{c.topics.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>{c.msg}<textarea name="message" required minLength={5} maxLength={4000} rows={6} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, height: 0, width: 0, opacity: 0 }} />
      <button className="tv-btn tv-btn-primary" disabled={state === "sending"}>{state === "sending" ? c.sending : c.send}</button>
      <p role="status" className={`tv-form-msg ${state}`}>{state === "ok" ? c.ok : state === "err" ? c.err : ""}</p>
    </form>
  );
}
