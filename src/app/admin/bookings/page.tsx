"use client";
import { useState } from "react";
import { Badge, CountrySelect, CsvButton, countryName, date, eur, Err, PAY, STATUS, TYPE, useCountry, useLoad } from "@/components/admin/ui";

type B = { id: string; starts_at: string; type: string; status: string; payment_status: string; price_cents: number; commission_cents: number; currency: string; practice: string; country: string; vet: string; client: string; clientPhone: string; pet: string; species: string; motive: string | null };

export default function Page() {
  const [f, setF] = useState({ type: "", status: "", q: "", from: "", to: "" });
  const [country, setCountry] = useCountry();
  const p = new URLSearchParams(Object.entries({ ...f, country }).filter(([, v]) => v)).toString();
  const { data, err, busy } = useLoad<{ items: B[] }>(`/api/admin/bookings?${p}`);
  return (
    <>
      <h1>Appuntamenti</h1>
      <div className="adm-filters">
        <input placeholder="Cerca cliente, paziente, veterinario, clinica" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Cerca" />
        <CountrySelect value={country} onChange={setCountry} />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Tipo"><option value="">Tutti i tipi</option>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Stato"><option value="">Tutti gli stati</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label className="adm-date">Dal<input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="adm-date">Al<input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value ? `${e.target.value}T23:59:59` : "" })} /></label>
        <CsvButton name={`appuntamenti-${country || "tutti"}`} rows={[["Data", "Paese", "Tipo", "Paziente", "Specie", "Cliente", "Telefono", "Veterinario", "Clinica", "Stato", "Pagamento", "Importo", "Commissione"], ...(data?.items ?? []).map((b) => [date(b.starts_at), countryName(b.country), TYPE[b.type], b.pet, b.species, b.client, b.clientPhone, b.vet, b.practice, STATUS[b.status], PAY[b.payment_status], eur(b.price_cents, b.currency), b.payment_status === "captured" ? eur(b.commission_cents, b.currency) : ""])]} />
      </div>
      <Err m={err} />
      <div className="adm-scroll"><table className="adm-table nolink"><thead><tr><th>Data</th><th>Paese</th><th>Tipo</th><th>Paziente</th><th>Cliente</th><th>Veterinario</th><th>Clinica</th><th>Stato</th><th>Pagamento</th><th>Importo</th><th>Commissione</th></tr></thead><tbody>
        {(data?.items ?? []).map((b) => <tr key={b.id}><td>{date(b.starts_at)}</td><td>{countryName(b.country)}</td><td>{TYPE[b.type]}</td><td>{b.pet || "—"}<small className="adm-sub">{b.species}</small></td><td>{b.client}<small className="adm-sub">{b.clientPhone}</small></td><td>{b.vet}</td><td>{b.practice}</td><td><Badge s={b.status} label={STATUS[b.status]} /></td><td>{PAY[b.payment_status]}</td><td>{eur(b.price_cents, b.currency)}</td><td>{b.payment_status === "captured" ? eur(b.commission_cents, b.currency) : "—"}</td></tr>)}</tbody></table></div>
      {!busy && !data?.items.length && <p className="adm-empty">Nessun appuntamento.</p>}
      {data && data.items.length >= 500 && <p className="adm-hint">Mostrati i 500 più recenti: restringi i filtri per vedere gli altri.</p>}
    </>
  );
}
