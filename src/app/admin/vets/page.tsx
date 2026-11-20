"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, CountrySelect, CsvButton, Err, Moneys, Types, countryName, useCountry, useLoad, type Stat } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/AdminShell";

type V = { id: string; display_name: string; email: string; active: boolean; approved: boolean; commission_pct: number | null; countryCommission: number; practices: { id: string; name: string; country: string; email: string | null; phone: string | null; city: string | null; commission_pct: number | null } | null; stats: Stat | null };

function Row({ v, onChange }: { v: V; onChange: () => void }) {
  const { api } = useAdmin();
  const [x, setX] = useState(v.commission_pct === null ? "" : String(v.commission_pct)), [e, setE] = useState("");
  const eff = v.commission_pct ?? v.practices?.commission_pct ?? v.countryCommission;
  const patch = async (body: object) => { try { await api(`/api/admin/practitioners/${v.id}`, { method: "PATCH", body }); onChange(); } catch (er) { setE((er as Error).message); } };
  return (
    <tr>
      <td>{v.display_name}<small className="adm-sub">{v.email}</small></td><td>{countryName(v.practices?.country)}<small className="adm-sub">{v.practices?.city}</small></td><td>{v.practices ? <a href={`/admin/practices/${v.practices.id}`}>{v.practices.name}</a> : "—"}<small className="adm-sub">{[v.practices?.email, v.practices?.phone].filter(Boolean).join(" · ")}</small></td>
      <td>{v.approved ? <Badge s="approved" label="Approvato" /> : <Badge s="pending" label="Da approvare" />}{!v.active && <Badge s="cancelled" label="Disattivo" />}</td>
      <td>{v.stats?.total ?? 0}<small className="adm-sub"><Types s={v.stats} /></small></td><td>{v.stats?.patients ?? 0}</td><td><Moneys m={v.stats?.revenue} /></td>
      <td><div className="adm-inline"><input type="number" min={0} max={100} step="0.5" value={x} placeholder={`${eff}`} onChange={(ev) => setX(ev.target.value)} aria-label="Commissione %" /><span>%</span><button className="adm-btn" onClick={() => patch({ commission_pct: x === "" ? null : Number(x) })}>Salva</button></div>{e && <small className="adm-err">{e}</small>}</td>
      <td><button className={`adm-btn ${v.approved ? "" : "ok"}`} onClick={() => patch({ approved: !v.approved })}>{v.approved ? "Revoca" : "Approva"}</button></td>
    </tr>
  );
}

function List() {
  const sp = useSearchParams(), [a, setA] = useState(sp.get("approved") ?? ""), [q, setQ] = useState("");
  const [country, setCountry] = useCountry(sp.get("country"));
  const p = new URLSearchParams(Object.entries({ approved: a, q, country }).filter(([, v]) => v)).toString();
  const { data, err, busy, reload } = useLoad<{ items: V[] }>(`/api/admin/practitioners?${p}`);
  return (
    <>
      <h1>Veterinari</h1>
      <div className="adm-filters"><input placeholder="Cerca per nome" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca" />
        <CountrySelect value={country} onChange={setCountry} />
        <select value={a} onChange={(e) => setA(e.target.value)} aria-label="Stato"><option value="">Tutti</option><option value="false">Da approvare</option><option value="true">Approvati</option></select>
        <CsvButton name={`veterinari-${country || "tutti"}`} rows={[["Veterinario", "E-mail", "Paese", "Clinica", "E-mail clinica", "Telefono clinica", "Approvato", "Appuntamenti", "Pazienti"], ...(data?.items ?? []).map((v) => [v.display_name, v.email, countryName(v.practices?.country), v.practices?.name, v.practices?.email, v.practices?.phone, v.approved ? "sì" : "no", v.stats?.total ?? 0, v.stats?.patients ?? 0])]} /></div>
      <Err m={err} />
      <div className="adm-scroll"><table className="adm-table nolink"><thead><tr><th>Veterinario</th><th>Paese</th><th>Clinica e contatti</th><th>Stato</th><th>Appuntamenti</th><th>Pazienti</th><th>Incassato</th><th>Commissione propria</th><th></th></tr></thead><tbody>{(data?.items ?? []).map((v) => <Row key={v.id + (v.commission_pct ?? "")} v={v} onChange={reload} />)}</tbody></table></div>
      {!busy && !data?.items.length && <p className="adm-empty">Nessun veterinario.</p>}
    </>
  );
}
export default function Page() { return <Suspense><List /></Suspense>; }
