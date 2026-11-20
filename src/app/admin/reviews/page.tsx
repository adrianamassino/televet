"use client";
import { useState } from "react";
import { date, Err, TYPE, useLoad } from "@/components/admin/ui";

type R = { items: { id: string; rating: number; comment: string | null; at: string; type: string; client: string; pet: string; vet: string; practice: string }[]; average: number | null; count: number; sent: number; dist: number[] };
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function Page() {
  const [r, setR] = useState("");
  const { data, err } = useLoad<R>(`/api/admin/reviews${r ? `?rating=${r}` : ""}`);
  return (
    <>
      <h1>Valutazioni dei clienti</h1><Err m={err} />
      {data && <div className="adm-tiles">
        <div className="adm-tile"><b>{data.average ?? "—"} / 5</b><span>Media</span><small>{data.count} valutazioni su {data.sent} richieste inviate</small></div>
        {[5, 4, 3, 2, 1].map((n) => <div className="adm-tile" key={n}><b>{data.dist[n - 1]}</b><span style={{ color: "#d99a00" }}>{stars(n)}</span></div>)}
      </div>}
      <div className="adm-filters"><select value={r} onChange={(e) => setR(e.target.value)} aria-label="Voto"><option value="">Tutti i voti</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stelle</option>)}</select></div>
      <div className="adm-scroll"><table className="adm-table nolink"><thead><tr><th>Data</th><th>Voto</th><th>Commento</th><th>Cliente</th><th>Paziente</th><th>Veterinario</th><th>Clinica</th><th>Tipo</th></tr></thead><tbody>
        {(data?.items ?? []).map((x) => <tr key={x.id}><td>{date(x.at)}</td><td style={{ color: x.rating <= 3 ? "#b42323" : "#d99a00", whiteSpace: "nowrap" }}>{stars(x.rating)}</td><td style={{ maxWidth: 380 }}>{x.comment || "—"}</td><td>{x.client}</td><td>{x.pet || "—"}</td><td>{x.vet}</td><td>{x.practice}</td><td>{TYPE[x.type]}</td></tr>)}</tbody></table></div>
      {data && !data.items.length && <p className="adm-empty">Ancora nessuna valutazione.</p>}
    </>
  );
}
