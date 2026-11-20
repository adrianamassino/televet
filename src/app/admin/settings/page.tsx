"use client";
import { useState } from "react";
import { CommissionInput, date, Err, useLoad } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/AdminShell";

type C = { code: string; currency: string; payment_provider: string; default_commission_pct: number; default_commission_fixed_cents: number | null; published: boolean };
type A = { id: number; created_at: string; actor: string; action: string; target_type: string; target_label: string | null; detail: object };
const ACTION: Record<string, string> = { approve: "Approvata", reject: "Rifiutata", suspend: "Sospesa", reopen: "Riportata in attesa", delete: "Eliminata", set_commission: "Commissione modificata", approve_vet: "Veterinario approvato", unapprove_vet: "Approvazione revocata", update_vet: "Veterinario modificato", delete_vet: "Veterinario eliminato", set_default_commission: "Standard paese modificato", update: "Modificata" };

function Row({ c, onSaved }: { c: C; onSaved: () => void }) {
  const { api } = useAdmin(), [e, setE] = useState("");
  return <tr><td>{c.code}</td><td>{c.currency}</td><td>{c.payment_provider === "stripe" ? "Stripe Connect" : "Mercado Pago"}</td>
    <td><CommissionInput pct={c.default_commission_fixed_cents == null ? c.default_commission_pct : null} fixed={c.default_commission_fixed_cents} cur={c.currency} onSave={async (b) => { try { await api(`/api/admin/countries/${c.code}`, { method: "PATCH", body: { default_commission_pct: b.commission_pct, default_commission_fixed_cents: b.commission_fixed_cents } }); setE(""); onSaved(); } catch (er) { setE((er as Error).message); } }} />{e && <small className="adm-err">{e}</small>}</td></tr>;
}

export default function Page() {
  const c = useLoad<{ items: C[] }>("/api/admin/countries"), a = useLoad<{ items: A[] }>("/api/admin/audit");
  return (
    <>
      <h1>Commissioni e registro</h1>
      <section className="adm-card"><h2>Commissione standard per paese</h2>
        <p className="adm-hint">Puoi scegliere una percentuale (trattenuta dal prezzo del veterinario) oppure un importo fisso in euro che si AGGIUNGE al prezzo del veterinario (es. 10 = 10,00 €). Si applica quando né il veterinario né la clinica hanno una commissione propria (si impostano nella scheda della clinica o del veterinario). Vale per le prenotazioni pagate online (Stripe Connect o Mercado Pago) fatte da ora in poi.</p>
        <Err m={c.err} /><table className="adm-table nolink"><thead><tr><th>Paese</th><th>Valuta</th><th>Pagamenti</th><th>Commissione standard</th></tr></thead><tbody>{(c.data?.items ?? []).map((x) => <Row key={x.code} c={x} onSaved={c.reload} />)}</tbody></table></section>
      <section className="adm-card"><h2>Registro delle azioni</h2><Err m={a.err} />
        <div className="adm-scroll"><table className="adm-table nolink"><thead><tr><th>Quando</th><th>Chi</th><th>Azione</th><th>Su</th></tr></thead><tbody>{(a.data?.items ?? []).map((x) => <tr key={x.id}><td>{date(x.created_at)}</td><td>{x.actor}</td><td>{ACTION[x.action] ?? x.action}</td><td>{x.target_label ?? x.target_type}</td></tr>)}</tbody></table></div>
        {a.data && !a.data.items.length && <p className="adm-empty">Ancora nessuna azione.</p>}</section>
    </>
  );
}
