"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, date, day, eur, Err, KIND, Moneys, PAY, REVIEW, STATUS, TYPE, Types, useLoad, type Stat } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/AdminShell";

type Vet = { id: string; display_name: string; title: string | null; active: boolean; approved: boolean; commission_pct: number | null; stats: Stat | null };
type D = {
  practice: { id: string; name: string; kind: string; country: string; address: string | null; postal_code: string | null; city: string | null; email: string | null; phone: string | null; website: string | null; slug: string; review_status: string; review_note: string | null; reviewed_by: string | null; reviewed_at: string | null; published: boolean; booking_enabled: boolean; commission_pct: number | null; stripe_status: string; mp_status: string; ownerEmail: string | null; created_at: string };
  country: { default_commission_pct: number; currency: string; payment_provider: string } | null; vets: Vet[]; stats: Stat | null;
  patients: { pet: string; species: string; client: string; visits: number; last: string }[];
  bookings: { id: string; starts_at: string; type: string; status: string; payment_status: string; price_cents: number; commission_cents: number; currency: string; vet: string; client: string; clientPhone: string; pet: string; species: string; service: string }[];
};

export default function Detail() {
  const { id } = useParams<{ id: string }>(), router = useRouter(), { api } = useAdmin();
  const { data: d, err, reload } = useLoad<D>(`/api/admin/practices/${id}`);
  const [msg, setMsg] = useState(""), [note, setNote] = useState(""), [pct, setPct] = useState<string | null>(null), [tab, setTab] = useState<"vets" | "patients" | "bookings">("vets");
  if (!d) return <><h1>Clinica</h1><Err m={err} /></>;
  const p = d.practice, std = Number(d.country?.default_commission_pct ?? 0), eff = p.commission_pct ?? std;
  const run = async (fn: () => Promise<unknown>, ok?: string) => { setMsg(""); try { await fn(); if (ok) setMsg(ok); await reload(); } catch (e) { setMsg((e as Error).message); } };
  const patch = (body: object, ok?: string) => run(() => api(`/api/admin/practices/${id}`, { method: "PATCH", body }), ok);
  const vet = (vid: string, body: object, ok?: string) => run(() => api(`/api/admin/practitioners/${vid}`, { method: "PATCH", body }), ok);
  async function remove() {
    if (prompt(`Per eliminare definitivamente "${p.name}" scrivi il suo nome:`) !== p.name) return;
    try { await api(`/api/admin/practices/${id}`, { method: "DELETE" }); router.push("/admin/practices"); }
    catch (e) { const m = (e as Error).message; setMsg(m.startsWith("has_bookings") ? `Non si può eliminare: ha ${m.split(":")[1]} appuntamenti nello storico. Usa "Sospendi" per toglierla dal sito mantenendo lo storico.` : m); }
  }
  return (
    <>
      <p><a href="/admin/practices">← Cliniche e veterinari</a></p>
      <div className="adm-head"><h1>{p.name}</h1><Badge s={p.review_status} label={REVIEW[p.review_status]} /></div>
      <Err m={msg && !msg.startsWith("✓") ? msg : ""} />{msg.startsWith("✓") && <p className="adm-ok">{msg}</p>}
      <div className="adm-actions">
        {p.review_status !== "approved" && <button className="adm-btn ok" onClick={() => patch({ action: "approve", note }, "✓ Approvata e pubblicata sul sito")}>Approva e pubblica</button>}
        {p.review_status === "pending" && <button className="adm-btn" onClick={() => patch({ action: "reject", note }, "✓ Rifiutata")}>Rifiuta</button>}
        {p.review_status === "approved" && <button className="adm-btn" onClick={() => patch({ action: "suspend", note }, "✓ Sospesa e tolta dal sito")}>Sospendi</button>}
        {(p.review_status === "rejected" || p.review_status === "suspended") && <button className="adm-btn" onClick={() => patch({ action: "reopen" }, "✓ Riportata in attesa")}>Riporta in attesa</button>}
        <button className="adm-btn" onClick={() => patch({ booking_enabled: !p.booking_enabled })}>{p.booking_enabled ? "Disattiva prenotazioni" : "Riattiva prenotazioni"}</button>
        <button className="adm-btn danger" onClick={remove}>Elimina</button>
      </div>
      <label className="adm-note">Nota interna / motivo (opzionale, salvata con l&apos;azione)<input value={note} onChange={(e) => setNote(e.target.value)} placeholder={p.review_note ?? ""} /></label>

      <div className="adm-grid2">
        <section className="adm-card"><h2>Scheda</h2><dl>
          <dt>Tipo</dt><dd>{KIND[p.kind]}</dd><dt>Indirizzo</dt><dd>{[p.address, p.postal_code, p.city, p.country].filter(Boolean).join(", ") || "—"}</dd>
          <dt>E-mail scheda</dt><dd>{p.email ?? "—"}</dd><dt>Account titolare</dt><dd>{p.ownerEmail ?? "—"}</dd><dt>Telefono</dt><dd>{p.phone ?? "—"}</dd>
          <dt>Iscritta il</dt><dd>{date(p.created_at)}</dd><dt>Pagamenti</dt><dd>{p.stripe_status === "active" ? "Stripe attivo" : p.mp_status === "active" ? "Mercado Pago attivo" : `Non configurati (${d.country?.payment_provider ?? "—"})`}</dd>
          {p.reviewed_at && <><dt>Ultima revisione</dt><dd>{date(p.reviewed_at)} da {p.reviewed_by}{p.review_note ? ` — ${p.review_note}` : ""}</dd></>}
        </dl>{p.published && <p><a href={`/${p.country === "AR" ? "es" : p.country === "IT" ? "it" : "fr"}/${p.country.toLowerCase()}/veterinaire/${p.slug}`} target="_blank">Apri la pagina pubblica ↗</a></p>}</section>

        <section className="adm-card"><h2>Commissione Televet</h2>
          <p>Commissione su ogni prenotazione pagata online. <b>Attuale: {eff}%</b> {p.commission_pct === null ? `(standard del paese ${d.practice.country})` : "(impostata per questa clinica)"}.</p>
          <div className="adm-inline"><input type="number" min={0} max={100} step="0.5" value={pct ?? (p.commission_pct ?? "")} placeholder={`${std} (standard)`} onChange={(e) => setPct(e.target.value)} aria-label="Commissione clinica %" /><span>%</span>
            <button className="adm-btn primary" onClick={() => patch({ commission_pct: pct === null || pct === "" ? null : Number(pct) }, "✓ Commissione salvata (vale per le prossime prenotazioni)").then(() => setPct(null))}>Salva</button>
            {p.commission_pct !== null && <button className="adm-btn" onClick={() => patch({ commission_pct: null }, "✓ Tornata allo standard del paese").then(() => setPct(null))}>Usa standard</button>}</div>
          <p className="adm-hint">Regola: se un veterinario ha una commissione sua vale quella; altrimenti quella della clinica; altrimenti lo standard del paese. Le prenotazioni già fatte non cambiano.</p>
          <button className="adm-btn" onClick={() => confirm("Togliere le commissioni personalizzate di tutti i veterinari? Tutti seguiranno la commissione della clinica.") && patch({ clearVetOverrides: true }, "✓ Tutti i veterinari ora seguono la clinica")}>Stessa commissione per tutti i veterinari</button>
        </section>
      </div>

      <div className="adm-tiles">
        <div className="adm-tile"><b>{d.stats?.total ?? 0}</b><span>Appuntamenti</span><small><Types s={d.stats} /></small></div>
        <div className="adm-tile"><b>{d.stats?.patients ?? 0}</b><span>Pazienti</span><small>{d.stats?.clients ?? 0} clienti</small></div>
        <div className="adm-tile"><b><Moneys m={d.stats?.revenue} /></b><span>Incassato (online)</span><small>Netto alla clinica: <Moneys m={d.stats?.revenue} k="net" /></small></div>
        <div className="adm-tile"><b><Moneys m={d.stats?.revenue} k="commission" /></b><span>Commissioni Televet</span></div>
      </div>

      <div className="adm-tabs" role="tablist">{([["vets", `Veterinari (${d.vets.length})`], ["patients", `Pazienti (${d.patients.length})`], ["bookings", `Appuntamenti (${d.bookings.length})`]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === "vets" && <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Veterinario</th><th>Stato</th><th>Appuntamenti</th><th>Pazienti</th><th>Incassato</th><th>Commissione propria</th><th></th></tr></thead><tbody>
        {d.vets.map((v) => <VetRow key={v.id} v={v} eff={eff} onSave={(x) => vet(v.id, { commission_pct: x }, "✓ Commissione veterinario salvata")} onApprove={() => vet(v.id, { approved: !v.approved }, v.approved ? "✓ Approvazione revocata" : "✓ Veterinario approvato")} onActive={() => vet(v.id, { active: !v.active })}
          onDelete={async () => { if (!confirm(`Eliminare ${v.display_name}?`)) return; try { await api(`/api/admin/practitioners/${v.id}`, { method: "DELETE" }); reload(); } catch (e) { const m = (e as Error).message; setMsg(m.startsWith("has_bookings") ? `Ha ${m.split(":")[1]} appuntamenti nello storico: non eliminabile, disattivalo.` : m); } }} />)}
      </tbody></table></div>}

      {tab === "patients" && <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Paziente</th><th>Specie</th><th>Cliente</th><th>Visite</th><th>Ultima</th></tr></thead><tbody>{d.patients.map((x, i) => <tr key={i}><td>{x.pet || "—"}</td><td>{x.species}</td><td>{x.client}</td><td>{x.visits}</td><td>{day(x.last)}</td></tr>)}</tbody></table>{!d.patients.length && <p className="adm-empty">Ancora nessun paziente.</p>}</div>}

      {tab === "bookings" && <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Data</th><th>Tipo</th><th>Paziente</th><th>Cliente</th><th>Veterinario</th><th>Stato</th><th>Pagamento</th><th>Importo</th><th>Commissione</th></tr></thead><tbody>{d.bookings.map((b) => <tr key={b.id}><td>{date(b.starts_at)}</td><td>{TYPE[b.type]}</td><td>{b.pet || "—"}</td><td>{b.client}<small className="adm-sub">{b.clientPhone}</small></td><td>{b.vet}</td><td><Badge s={b.status} label={STATUS[b.status]} /></td><td>{PAY[b.payment_status]}</td><td>{eur(b.price_cents, b.currency)}</td><td>{b.payment_status === "captured" ? eur(b.commission_cents, b.currency) : "—"}</td></tr>)}</tbody></table>{!d.bookings.length && <p className="adm-empty">Ancora nessun appuntamento.</p>}</div>}
    </>
  );
}

function VetRow({ v, eff, onSave, onApprove, onActive, onDelete }: { v: Vet; eff: number; onSave: (x: number | null) => void; onApprove: () => void; onActive: () => void; onDelete: () => void }) {
  const [x, setX] = useState<string>(v.commission_pct === null ? "" : String(v.commission_pct));
  return (
    <tr>
      <td>{v.display_name}{v.title && <small className="adm-sub">{v.title}</small>}</td>
      <td>{v.approved ? <Badge s="approved" label="Approvato" /> : <Badge s="pending" label="Da approvare" />}{!v.active && <Badge s="cancelled" label="Disattivo" />}</td>
      <td>{v.stats?.total ?? 0}<small className="adm-sub"><Types s={v.stats} /></small></td><td>{v.stats?.patients ?? 0}</td><td><Moneys m={v.stats?.revenue} /></td>
      <td><div className="adm-inline"><input type="number" min={0} max={100} step="0.5" value={x} placeholder={`${eff} (clinica)`} onChange={(e) => setX(e.target.value)} aria-label={`Commissione ${v.display_name}`} /><span>%</span><button className="adm-btn" onClick={() => onSave(x === "" ? null : Number(x))}>Salva</button></div></td>
      <td><div className="adm-rowact"><button className={`adm-btn ${v.approved ? "" : "ok"}`} onClick={onApprove}>{v.approved ? "Revoca" : "Approva"}</button><button className="adm-btn" onClick={onActive}>{v.active ? "Disattiva" : "Attiva"}</button><button className="adm-btn danger" onClick={onDelete}>Elimina</button></div></td>
    </tr>
  );
}
