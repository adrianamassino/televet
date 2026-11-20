"use client";
import { useState } from "react";
import { Badge, date, eur, Err, PAY, STATUS, TYPE, useLoad } from "@/components/admin/ui";

type B = { id: string; starts_at: string; type: string; status: string; payment_status: string; price_cents: number; commission_cents: number; currency: string; practice: string; vet: string; client: string; clientPhone: string; pet: string; species: string; motive: string | null };

export default function Page() {
  const [f, setF] = useState({ type: "", status: "", q: "", from: "", to: "" });
  const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const { data, err, busy } = useLoad<{ items: B[] }>(`/api/admin/bookings?${p}`);
  return (
    <>
      <h1>Appuntamenti</h1>
      <div className="adm-filters">
        <input placeholder="Cerca cliente, paziente, veterinario, clinica" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Cerca" />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Tipo"><option value="">Tutti i tipi</option>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Stato"><option value="">Tutti gli stati</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label className="adm-date">Dal<input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="adm-date">Al<input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value ? `${e.target.value}T23:59:59` : "" })} /></label>
      </div>
      <Err m={err} />
      <div className="adm-scroll"><table className="adm-table nolink"><thead><tr><th>Data</th><th>Tipo</th><th>Paziente</th><th>Cliente</th><th>Veterinario</th><th>Clinica</th><th>Stato</th><th>Pagamento</th><th>Importo</th><th>Commissione</th></tr></thead><tbody>
        {(data?.items ?? []).map((b) => <tr key={b.id}><td>{date(b.starts_at)}</td><td>{TYPE[b.type]}</td><td>{b.pet || "—"}<small className="adm-sub">{b.species}</small></td><td>{b.client}<small className="adm-sub">{b.clientPhone}</small></td><td>{b.vet}</td><td>{b.practice}</td><td><Badge s={b.status} label={STATUS[b.status]} /></td><td>{PAY[b.payment_status]}</td><td>{eur(b.price_cents, b.currency)}</td><td>{b.payment_status === "captured" ? eur(b.commission_cents, b.currency) : "—"}</td></tr>)}</tbody></table></div>
      {!busy && !data?.items.length && <p className="adm-empty">Nessun appuntamento.</p>}
      {data && data.items.length >= 500 && <p className="adm-hint">Mostrati i 500 più recenti: restringi i filtri per vedere gli altri.</p>}
    </>
  );
}
