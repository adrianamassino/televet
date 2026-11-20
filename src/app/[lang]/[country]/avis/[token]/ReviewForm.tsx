"use client";
import { useState } from "react";

type C = { title: string; sub: string; comment: string; placeholder: string; send: string; sending: string; thanks: string; thanks5: string; googleBtn: string; copy: string; copied: string; done: string; err: string; labels: string[] };

export function ReviewForm({ c, token, initial, already, practice }: { c: C; token: string; initial: number; already: boolean; practice: string }) {
  const [rating, setRating] = useState(initial), [hover, setHover] = useState(0), [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "err">(already ? "done" : "idle"), [google, setGoogle] = useState<string | null>(null), [copied, setCopied] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!rating) return; setState("sending");
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, rating, comment: text }) });
      if (r.status === 409) { setState("done"); return; }
      if (!r.ok) { setState("err"); return; }
      setGoogle((await r.json()).google ?? null); setState("done");
    } catch { setState("err"); }
  }
  if (state === "done") return (
    <div className="tv-rv-done" role="status">
      <p className="tv-rv-big">{already ? c.done : rating === 5 ? c.thanks5 : c.thanks}</p>
      {rating === 5 && !already && google && <>
        <a className="tv-btn tv-btn-primary" href={google} target="_blank" rel="noopener noreferrer">{c.googleBtn}</a>
        {text && <button type="button" className="tv-rv-copy" onClick={() => { navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {}); }}>{copied ? c.copied : c.copy}</button>}
      </>}
    </div>
  );
  const shown = hover || rating;
  return (
    <form onSubmit={submit} className="tv-rv">
      <p className="tv-rv-practice">{practice}</p>
      <div className="tv-rv-stars" role="radiogroup" aria-label={c.title} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} — ${c.labels[n - 1]}`} className={n <= shown ? "on" : ""} onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onBlur={() => setHover(0)} onClick={() => setRating(n)}>★</button>
        ))}
      </div>
      <p className="tv-rv-label" aria-live="polite">{shown ? c.labels[shown - 1] : c.sub}</p>
      <label className="tv-rv-c">{c.comment}<textarea rows={4} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder={c.placeholder} /></label>
      <button className="tv-btn tv-btn-primary" disabled={!rating || state === "sending"}>{state === "sending" ? c.sending : c.send}</button>
      {state === "err" && <p role="alert" className="tv-form-msg err">{c.err}</p>}
    </form>
  );
}
