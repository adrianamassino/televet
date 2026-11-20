"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, CountrySelect, CsvButton, Err, KIND, Moneys, REVIEW, Types, countryName, useCountry, useLoad, day, type Stat } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/AdminShell";

type P = { id: string; name: string; kind: string; country: string; city: string | null; address: string | null; postal_code: string | null; email: string | null; phone: string | null; review_status: string; stripe_status: string; mp_status: string; commission_pct: number | null; countryCommission: number; created_at: string; vets: number; vetsPending: number; stats: Stat | null };

function List() {
  const sp = useSearchParams(), { api } = useAdmin();
  const [f, setF] = useState({ status: sp.get("status") ?? "", kind: "", q: "" }), [msg, setMsg] = useState("");
  const [country, setCountry] = useCountry(sp.get("country"));
  const qs = new URLSearchParams(Object.entries({ ...f, country }).filter(([, v]) => v)).toString();
  const { data, err, busy, reload } = useLoad<{ items: P[] }>(`/api/admin/practices?${qs}`);
  async function act(id: string, action: string) { try { await api(`/api/admin/practices/${id}`, { method: "PATCH", body: { action } }); reload(); } catch (e) { setMsg((e as Error).message); } }
  return (
    <>
      <h1>Cliniche e veterinari {data && <small>({data.items.length}{country ? ` · ${countryName(country)}` : ""})</small>}</h1>
      <div className="adm-filters">
        <input placeholder="Cerca nome, città, e-mail" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Cerca" />
        <CountrySelect value={country} onChange={setCountry} />
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Stato"><option value="">Tutti gli stati</option>{Object.entries(REVIEW).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} aria-label="Tipo"><option value="">Tutti i tipi</option>{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <CsvButton name={`cliniche-${country || "tutti"}`} rows={[["Nome", "Tipo", "Paese", "Città", "Indirizzo", "CAP", "E-mail", "Telefono", "Stato", "Veterinari", "Appuntamenti", "Pazienti", "Commissione %", "Iscritta il"], ...(data?.items ?? []).map((p) => [p.name, KIND[p.kind], countryName(p.country), p.city, p.address, p.postal_code, p.email, p.phone, REVIEW[p.review_status], p.vets, p.stats?.total ?? 0, p.stats?.patients ?? 0, p.commission_pct ?? p.countryCommission, day(p.created_at)])]} />
      </div>
      <Err m={err || msg} />
      <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Paese e città</th><th>Contatti</th><th>Stato</th><th>Vet</th><th>Appuntamenti</th><th>Pazienti</th><th>Incassato</th><th>Commissione</th><th>Pagamenti</th><th>Iscritta</th></tr></thead>
        <tbody>{(data?.items ?? []).map((p) => (
          <tr key={p.id} onClick={() => (location.href = `/admin/practices/${p.id}`)}>
            <td><a href={`/admin/practices/${p.id}`}>{p.name}</a></td><td>{KIND[p.kind]}</td><td>{countryName(p.country)}<small className="adm-sub">{[p.city, p.postal_code].filter(Boolean).join(" ")}</small></td><td>{p.email ?? "—"}<small className="adm-sub">{p.phone}</small></td>
            <td><Badge s={p.review_status} label={REVIEW[p.review_status]} />{p.review_status === "pending" && <div className="adm-rowact" style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}><button className="adm-btn ok" onClick={() => act(p.id, "approve")}>Approva</button><button className="adm-btn" onClick={() => act(p.id, "reject")}>Rifiuta</button></div>}</td>
            <td>{p.vets}{p.vetsPending > 0 && <span className="adm-dot" title="Veterinari da approvare"> ●{p.vetsPending}</span>}</td>
            <td>{p.stats?.total ?? 0}<small className="adm-sub"><Types s={p.stats} /></small></td><td>{p.stats?.patients ?? 0}</td>
            <td><Moneys m={p.stats?.revenue} /></td>
            <td>{p.commission_pct ?? p.countryCommission}%<small className="adm-sub">{p.commission_pct === null ? "standard paese" : "propria"}</small></td>
            <td>{p.stripe_status === "active" ? "Stripe ✓" : p.mp_status === "active" ? "Mercado Pago ✓" : "—"}</td><td>{day(p.created_at)}</td>
          </tr>))}
        </tbody></table></div>
      {!busy && !data?.items.length && <p className="adm-empty">Nessun risultato.</p>}
    </>
  );
}
export default function Page() { return <Suspense><List /></Suspense>; }
