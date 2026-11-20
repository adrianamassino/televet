"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser, errText } from "@/lib/auth-client";
import { H } from "@/lib/pet-health-copy";
import { daysUntil, RECORD_KINDS, type Proposal, type RecordKind } from "@/lib/pet-health";

type Rec = { id: string; kind: RecordKind; name: string; done_on: string | null; next_due: string | null; vet_name: string | null; document_id: string | null };
type Doc = { id: string; storage_path: string; created_at: string; url?: string };
type Row = Proposal & { key: string; include: boolean; documentId: string };

/** Shrinks a phone photo (often 8–12 MB) to ≤1800 px JPEG so it uploads fast and fits the reader's size limit. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.82));
    if (blob) return blob;
  } catch {}
  return file;
}

export default function PetHealth({ lang, country, petId }: { lang: string; country: string; petId: string }) {
  const li = ["fr", "it", "en", "es"].indexOf(lang) < 0 ? 2 : ["fr", "it", "en", "es"].indexOf(lang);
  const t = (k: string) => H[k]?.[li] ?? k;
  const sb = useMemo(() => supabaseBrowser(), []);
  const [uid, setUid] = useState<string | null | undefined>(undefined), [pet, setPet] = useState<{ name: string; species: string } | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]), [docs, setDocs] = useState<Doc[]>([]), [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(""), [msg, setMsg] = useState(""), [form, setForm] = useState({ kind: "vaccine" as RecordKind, name: "", done_on: "", next_due: "", vet_name: "" });
  const cam = useRef<HTMLInputElement>(null), pick = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10), base = `/${lang}/${country}`;

  const load = useCallback(async () => {
    const { data: u } = await sb.auth.getUser(); setUid(u.user?.id ?? null); if (!u.user) return;
    const [p, r, d] = await Promise.all([
      sb.from("pets").select("name, species").eq("id", petId).maybeSingle(),
      sb.from("pet_health_records").select("id, kind, name, done_on, next_due, vet_name, document_id").eq("pet_id", petId).order("done_on", { ascending: false, nullsFirst: false }),
      sb.from("pet_documents").select("id, storage_path, created_at").eq("pet_id", petId).order("created_at", { ascending: false }),
    ]);
    setPet(p.data); setRecs((r.data as Rec[]) ?? []);
    const docsList = (d.data as Doc[]) ?? [];
    if (docsList.length) { const { data: urls } = await sb.storage.from("pet-docs").createSignedUrls(docsList.map((x) => x.storage_path), 3600); docsList.forEach((x, i) => { x.url = urls?.[i]?.signedUrl ?? undefined; }); }
    setDocs(docsList);
  }, [sb, petId]);
  useEffect(() => { load(); }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length || !uid) return; setMsg(""); const found: Row[] = [];
    const list = Array.from(files).slice(0, 12);
    for (let i = 0; i < list.length; i++) {
      setBusy(`${t("reading")} (${t("page")} ${i + 1}/${list.length})`);
      try {
        const blob = await shrink(list[i]);
        const path = `${uid}/${petId}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from("pet-docs").upload(path, blob, { contentType: "image/jpeg" }); if (up.error) throw up.error;
        const { data: doc, error } = await sb.from("pet_documents").insert({ pet_id: petId, owner_id: uid, kind: "booklet", storage_path: path }).select("id").single(); if (error) throw error;
        const { data: s } = await sb.auth.getSession();
        const r = await fetch(`/api/owner/pets/${petId}/scan`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${s.session?.access_token}` }, body: JSON.stringify({ documentId: doc.id }) });
        if (r.status === 503) { setMsg(t("noScan")); continue; }
        if (!r.ok) { setMsg(t("scanFail")); continue; }
        const { proposals } = (await r.json()) as { proposals: Proposal[] };
        if (!proposals.length) setMsg(t("nothing"));
        for (const p of proposals) {
          const dup = recs.some((x) => x.kind === p.kind && x.name.toLowerCase() === p.name.toLowerCase() && x.done_on === p.done_on) || found.some((x) => x.kind === p.kind && x.name.toLowerCase() === p.name.toLowerCase() && x.done_on === p.done_on);
          if (!dup) found.push({ ...p, key: crypto.randomUUID(), include: true, documentId: doc.id });
        }
      } catch (e) { setMsg(t("err") + errText(e)); }
    }
    setBusy(""); setRows((cur) => [...cur, ...found]); load();
  }

  async function saveRows() {
    if (!uid) return; const chosen = rows.filter((r) => r.include && r.name.trim()); if (!chosen.length) return;
    setBusy("…");
    const { error } = await sb.from("pet_health_records").insert(chosen.map((r) => ({ pet_id: petId, owner_id: uid, document_id: r.documentId, kind: r.kind, name: r.name.trim(), done_on: r.done_on || null, next_due: r.next_due || null, vet_name: r.vet_name?.trim() || null, notes: r.notes, source: "scan" })));
    setBusy(""); if (error) return setMsg(t("err") + errText(error));
    setRows([]); setMsg(t("saved")); load();
  }
  async function addManual() {
    if (!uid || !form.name.trim()) return;
    const { error } = await sb.from("pet_health_records").insert({ pet_id: petId, owner_id: uid, kind: form.kind, name: form.name.trim(), done_on: form.done_on || null, next_due: form.next_due || null, vet_name: form.vet_name.trim() || null, source: "manual" });
    if (error) return setMsg(t("err") + errText(error));
    setForm({ ...form, name: "", done_on: "", next_due: "", vet_name: "" }); setMsg(t("saved")); load();
  }
  const delRec = async (r: Rec) => { if (confirm(t("askDel"))) { await sb.from("pet_health_records").delete().eq("id", r.id); load(); } };
  const delDoc = async (d: Doc) => { if (confirm(t("askDelDoc"))) { await sb.storage.from("pet-docs").remove([d.storage_path]); await sb.from("pet_documents").delete().eq("id", d.id); load(); } };
  const plusYear = async (r: Rec) => { if (!r.done_on) return; const d = new Date(`${r.done_on}T12:00:00Z`); d.setUTCFullYear(d.getUTCFullYear() + 1); await sb.from("pet_health_records").update({ next_due: d.toISOString().slice(0, 10), remind_30_at: null, remind_7_at: null, remind_0_at: null }).eq("id", r.id); load(); };
  const setRow = (key: string, patch: Partial<Row>) => setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const fmt = (iso: string | null) => (iso ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)) : "—");
  const due = (iso: string) => { const d = daysUntil(iso, today); return { d, label: d < 0 ? t("overdue") : d === 0 ? t("today") : t("inDays").replace("{n}", String(d)), cls: d < 0 ? "late" : d <= 30 ? "soon" : "ok" }; };
  const upcoming = recs.filter((r) => r.next_due).sort((a, b) => a.next_due!.localeCompare(b.next_due!));
  const groups = (RECORD_KINDS as readonly string[]).map((k) => ({ k, items: recs.filter((r) => r.kind === k) })).filter((g) => g.items.length);
  const kindSelect = (value: RecordKind, onChange: (k: RecordKind) => void) => <select className="field" value={value} onChange={(e) => onChange(e.target.value as RecordKind)} aria-label={t("kind")}>{RECORD_KINDS.map((k) => <option key={k} value={k}>{t(k)}</option>)}</select>;

  if (uid === undefined) return <p>…</p>;
  if (uid === null) return <p><a href={`${base}/compte`}>{t("login")}</a></p>;
  return (
    <div className="ph">
      <p><a href={`${base}/compte`}>{t("back")}</a></p>
      <h1>{t("title")}{pet ? ` — ${pet.name}` : ""}</h1>
      <p className="ph-note">{t("disclaimer")}</p>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>{t("scanH")}</h2><p>{t("scanP")}</p>
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <input ref={pick} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <p><button className="btn" disabled={!!busy} onClick={() => cam.current?.click()}>{t("take")}</button>{" "}<button className="btn btn-ghost" disabled={!!busy} onClick={() => pick.current?.click()}>{t("pick")}</button></p>
        {busy && <p role="status">{busy}</p>}
        <small>{t("private")}</small>
        {rows.length > 0 && <div className="ph-review"><p><strong>{t("check")}</strong></p>
          {rows.map((r) => <div key={r.key} className="ph-row">
            <label><input type="checkbox" checked={r.include} onChange={(e) => setRow(r.key, { include: e.target.checked })} /></label>
            {kindSelect(r.kind, (k) => setRow(r.key, { kind: k }))}
            <input className="field" value={r.name} onChange={(e) => setRow(r.key, { name: e.target.value })} aria-label={t("name")} />
            <label>{t("doneOn")}<input className="field" type="date" value={r.done_on ?? ""} onChange={(e) => setRow(r.key, { done_on: e.target.value || null })} /></label>
            <label>{t("nextDue")}<input className="field" type="date" value={r.next_due ?? ""} onChange={(e) => setRow(r.key, { next_due: e.target.value || null })} /></label>
          </div>)}
          <p><button className="btn" disabled={!!busy} onClick={saveRows}>{t("saveSel")}</button></p></div>}
        {msg && <p role="alert">{msg}</p>}
      </section>

      <section><h2>{t("upcoming")}</h2><small>{t("upNote")}</small>
        {upcoming.length === 0 ? <p>{t("noUp")}</p> : <ul className="ph-list">{upcoming.map((r) => { const u = due(r.next_due!); return <li key={r.id}><span><strong>{r.name}</strong><small>{t(r.kind)}</small></span><span className={`ph-chip ${u.cls}`}>{fmt(r.next_due)} · {u.label}</span></li>; })}</ul>}
        <p><a className="btn btn-ghost" href={`${base}/recherche`}>{t("book")}</a></p></section>

      <section><h2>{t("history")}</h2>
        {groups.length === 0 ? <p>{t("noHist")}</p> : groups.map((g) => <div key={g.k}><h3>{t(g.k)}</h3><ul className="ph-list">{g.items.map((r) => <li key={r.id}>
          <span><strong>{r.name}</strong><small>{fmt(r.done_on)}{r.vet_name ? ` · ${r.vet_name}` : ""}</small></span>
          <span className="ph-actions">{r.next_due ? <span className={`ph-chip ${due(r.next_due).cls}`}>{fmt(r.next_due)}</span> : r.done_on && (r.kind === "vaccine" || r.kind === "antiparasitic") && <button className="btn btn-quiet" onClick={() => plusYear(r)}>{t("plus1y")}</button>}
            <button className="btn btn-quiet" onClick={() => delRec(r)}>{t("del")}</button></span></li>)}</ul></div>)}
        <details className="panel"><summary><strong>{t("add")}</strong></summary>
          <div className="ph-row">{kindSelect(form.kind, (k) => setForm({ ...form, kind: k }))}<input className="field" placeholder={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>{t("doneOn")}<input className="field" type="date" value={form.done_on} onChange={(e) => setForm({ ...form, done_on: e.target.value })} /></label>
            <label>{t("nextDue")}<input className="field" type="date" value={form.next_due} onChange={(e) => setForm({ ...form, next_due: e.target.value })} /></label>
            <input className="field" placeholder={t("vet")} value={form.vet_name} onChange={(e) => setForm({ ...form, vet_name: e.target.value })} /></div>
          <p><button className="btn" disabled={!form.name.trim()} onClick={addManual}>{t("add")}</button></p></details></section>

      <section><h2>{t("photos")}</h2>
        {docs.length === 0 ? <p>{t("noPhotos")}</p> : <div className="ph-photos">{docs.map((d) => <figure key={d.id}>{d.url && <a href={d.url} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.url} alt="" loading="lazy" /></a>}<figcaption><button className="btn btn-quiet" onClick={() => delDoc(d)}>{t("del")}</button></figcaption></figure>)}</div>}</section>
    </div>
  );
}
