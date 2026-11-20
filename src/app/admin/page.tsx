"use client";
import { Badge, countryName, date, eur, Err, KIND, Moneys, REVIEW, TYPE, useLoad, type Stat } from "@/components/admin/ui";

type O = { owners: number; pets: number; practices: number; pending: number; approved: number; rejected: number; suspended: number; vetsPending: number; newOwners: number; newPractices: number; claims: number; chats: number; bookings: Stat; byCountry: { country: string; practices: number; pending: number; owners: number; bookings: number; revenue: Record<string, number> }[]; pendingList: { id: string; name: string; kind: string; country: string; created_at: string; review_status: string }[] };

export default function Overview() {
  const { data: o, err, busy } = useLoad<O>("/api/admin/overview");
  return (
    <>
      <h1>Panoramica</h1><Err m={err} />
      {busy && !o && <p>Caricamento…</p>}
      {o && <>
        {(o.pending > 0 || o.vetsPending > 0) && <div className="adm-alert"><strong>Da fare:</strong> {o.pending > 0 && <a href="/admin/practices?status=pending">{o.pending} {o.pending === 1 ? "clinica/veterinario da approvare" : "cliniche/veterinari da approvare"}</a>}{o.pending > 0 && o.vetsPending > 0 && " · "}{o.vetsPending > 0 && <a href="/admin/vets?approved=false">{o.vetsPending} veterinari in attesa</a>}{o.claims > 0 && <> · {o.claims} richieste di rivendicazione scheda</>}{o.chats > 0 && <> · <a href="/admin/chats">{o.chats} chat da seguire</a></>}</div>}
        <div className="adm-tiles">
          <Tile n={o.practices} l="Cliniche e veterinari" sub={`${o.approved} approvati · ${o.pending} in attesa`} href="/admin/practices" />
          <Tile n={o.owners} l="Proprietari iscritti" sub={`+${o.newOwners} negli ultimi 30 giorni`} href="/admin/users?role=owner" />
          <Tile n={o.pets} l="Animali registrati" />
          <Tile n={o.bookings.total} l="Appuntamenti" sub={Object.entries(o.bookings.byType).map(([t, n]) => `${TYPE[t] ?? t} ${n}`).join(" · ")} href="/admin/bookings" />
          <Tile n={o.bookings.patients} l="Pazienti passati da Televet" sub={`${o.bookings.clients} clienti`} />
          <Tile n={<Moneys m={o.bookings.revenue} k="gross" />} l="Incassato (pagamenti online)" sub={<>Commissioni Televet: <Moneys m={o.bookings.revenue} k="commission" /></>} />
        </div>
        <h2>Per paese</h2>
        {o.byCountry.length === 0 ? <p className="adm-empty">Ancora nessun dato.</p> :
          <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Paese</th><th>Cliniche e veterinari</th><th>Da approvare</th><th>Proprietari</th><th>Appuntamenti</th><th>Incassato</th></tr></thead><tbody>
            {o.byCountry.map((c) => <tr key={c.country} onClick={() => { try { localStorage.setItem("adm-country", c.country); } catch {} location.href = "/admin/practices"; }}><td><a href="/admin/practices" onClick={() => { try { localStorage.setItem("adm-country", c.country); } catch {} }}>{countryName(c.country)}</a></td><td>{c.practices}</td><td>{c.pending || "—"}</td><td>{c.owners}</td><td>{c.bookings}</td><td>{Object.entries(c.revenue).map(([cur, v]) => eur(v, cur)).join(" + ") || "—"}</td></tr>)}
          </tbody></table></div>}
        <h2>Ultime iscrizioni da approvare</h2>
        {o.pendingList.length === 0 ? <p className="adm-empty">Nessuna iscrizione in attesa.</p> :
          <table className="adm-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Paese</th><th>Iscritta il</th><th>Stato</th></tr></thead><tbody>
            {o.pendingList.map((p) => <tr key={p.id} onClick={() => (location.href = `/admin/practices/${p.id}`)}><td><a href={`/admin/practices/${p.id}`}>{p.name}</a></td><td>{KIND[p.kind]}</td><td>{countryName(p.country)}</td><td>{date(p.created_at)}</td><td><Badge s={p.review_status} label={REVIEW[p.review_status]} /></td></tr>)}
          </tbody></table>}
      </>}
    </>
  );
}
function Tile({ n, l, sub, href }: { n: React.ReactNode; l: string; sub?: React.ReactNode; href?: string }) {
  const c = <><b>{n}</b><span>{l}</span>{sub && <small>{sub}</small>}</>;
  return href ? <a className="adm-tile" href={href}>{c}</a> : <div className="adm-tile">{c}</div>;
}
