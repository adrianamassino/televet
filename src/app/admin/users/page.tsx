"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, CountrySelect, CsvButton, countryName, date, Err, REVIEW, useCountry, useLoad } from "@/components/admin/ui";

type U = { id: string; email: string; provider: string; created_at: string; last_sign_in_at: string | null; name: string; phone: string; country: string; roles: string[]; pets: string[]; practices: { id: string; name: string; kind: string; review_status: string }[]; bookings: number };

function List() {
  const sp = useSearchParams(), [role, setRole] = useState(sp.get("role") ?? ""), [q, setQ] = useState("");
  const [country, setCountry] = useCountry(sp.get("country"));
  const p = new URLSearchParams(Object.entries({ role, q, country }).filter(([, v]) => v)).toString();
  const { data, err, busy } = useLoad<{ items: U[]; total: number }>(`/api/admin/users?${p}`);
  return (
    <>
      <h1>Iscritti {data && <small>({data.total})</small>}</h1>
      <div className="adm-filters"><input placeholder="Cerca e-mail, nome, animale, clinica" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca" />
        <CountrySelect value={country} onChange={setCountry} />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Ruolo"><option value="">Tutti</option><option value="owner">Proprietari</option><option value="pro">Veterinari / cliniche</option></select>
        <CsvButton name={`iscritti-${country || "tutti"}`} rows={[["Iscritto il", "E-mail", "Nome", "Telefono", "Paese", "Ruolo", "Animali", "Clinica", "Appuntamenti"], ...(data?.items ?? []).map((u) => [date(u.created_at), u.email, u.name, u.phone, countryName(u.country), u.roles.map((r) => (r === "owner" ? "Proprietario" : "Professionista")).join(", "), u.pets.join(", "), u.practices.map((x) => x.name).join(", "), u.bookings])]} /></div>
      <Err m={err} />
      <div className="adm-scroll"><table className="adm-table nolink"><thead><tr><th>Iscritto il</th><th>E-mail</th><th>Nome e telefono</th><th>Paese</th><th>Ruolo</th><th>Animali</th><th>Clinica</th><th>Appuntamenti</th><th>Ultimo accesso</th><th>Accesso</th></tr></thead><tbody>
        {(data?.items ?? []).map((u) => <tr key={u.id}><td>{date(u.created_at)}</td><td>{u.email}</td><td>{u.name || "—"}<small className="adm-sub">{u.phone}</small></td><td>{countryName(u.country)}</td>
          <td>{u.roles.map((r) => r === "owner" ? "Proprietario" : "Professionista").join(", ") || "—"}</td><td>{u.pets.join(", ") || "—"}</td>
          <td>{u.practices.map((p) => <div key={p.id}><a href={`/admin/practices/${p.id}`}>{p.name}</a> <Badge s={p.review_status} label={REVIEW[p.review_status]} /></div>)}</td>
          <td>{u.bookings}</td><td>{date(u.last_sign_in_at)}</td><td>{u.provider}</td></tr>)}</tbody></table></div>
      {!busy && !data?.items.length && <p className="adm-empty">Nessun iscritto.</p>}
    </>
  );
}
export default function Page() { return <Suspense><List /></Suspense>; }
