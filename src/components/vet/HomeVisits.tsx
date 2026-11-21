"use client";
import { useCallback, useEffect, useState } from "react";
import { TRAVEL_CHOICES } from "@/lib/travel";
import type { ZoneForm } from "@/lib/zones";

/** Home-visit settings of one vet: area covered (radius around an address, or list of postal codes), optional wider area with a surcharge, travel time. */
type VetHV = { id: string; name: string; travelMin: number; hasHomeService: boolean; calendarConnected: boolean; zone: ZoneForm | null };
type Data = { ready: boolean; country: string; currency: string; autoConfirm: boolean; vets: VetHV[] };
type Place = { label: string; lat: number; lng: number };

const L = ["fr", "it", "en", "es", "pl"] as const;
const S: Record<string, [string, string, string, string, string]> = {
  title: ["Visites à domicile", "Visite a domicilio", "Home visits", "Visitas a domicilio", "Wizyty domowe"],
  area: ["Zone d'intervention", "Zona d'intervento", "Area you cover", "Zona de atención", "Obszar dojazdu"],
  byRadius: ["Distance autour d'une adresse", "Distanza da un indirizzo", "Distance around an address", "Distancia desde una dirección", "Odległość od adresu"],
  byPostal: ["Liste de codes postaux", "Elenco di CAP", "List of postal codes", "Lista de códigos postales", "Lista kodów pocztowych"],
  start: ["Adresse de départ (jamais montrée aux clients)", "Indirizzo di partenza (mai mostrato ai clienti)", "Starting address (never shown to clients)", "Dirección de salida (nunca se muestra a los clientes)", "Adres wyjazdu (nie jest pokazywany klientom)"],
  km: ["Rayon (km)", "Raggio (km)", "Radius (km)", "Radio (km)", "Promień (km)"],
  codes: ["Codes postaux, séparés par des virgules. 75* = tous ceux qui commencent par 75.", "CAP separati da virgole. 201* = tutti quelli che iniziano con 201.", "Postal codes, separated by commas. 201* = every code starting with 201.", "Códigos postales separados por comas. 280* = todos los que empiezan por 280.", "Kody pocztowe po przecinku. 00-* = wszystkie zaczynające się od 00-."],
  wider: ["Zone élargie avec supplément", "Zona più ampia con supplemento", "Wider area with a surcharge", "Zona ampliada con recargo", "Szerszy obszar z dopłatą"],
  widerKm: ["Jusqu'à (km)", "Fino a (km)", "Up to (km)", "Hasta (km)", "Do (km)"], widerCodes: ["Codes postaux supplémentaires", "CAP aggiuntivi", "Additional postal codes", "Códigos postales adicionales", "Dodatkowe kody"],
  fee: ["Supplément", "Supplemento", "Surcharge", "Recargo", "Dopłata"],
  travel: ["Temps de trajet bloqué avant et après chaque visite", "Tempo di tragitto bloccato prima e dopo ogni visita", "Travel time kept free before and after each visit", "Tiempo de trayecto bloqueado antes y después de cada visita", "Czas dojazdu blokowany przed i po wizycie"],
  travelHelp: ["Aucun autre rendez-vous ne peut être pris pendant ce temps.", "In questo tempo non si possono prendere altri appuntamenti.", "No other appointment can be booked during this time.", "No se puede reservar otra cita en ese tiempo.", "W tym czasie nie można zarezerwować innej wizyty."],
  save: ["Enregistrer", "Salva", "Save", "Guardar", "Zapisz"], saved: ["Enregistré", "Salvato", "Saved", "Guardado", "Zapisano"], remove: ["Supprimer la zone", "Elimina la zona", "Remove the area", "Eliminar la zona", "Usuń obszar"],
  noZone: ["Aucune zone : les clients ne peuvent pas encore réserver de visite à domicile avec ce vétérinaire.", "Nessuna zona: i clienti non possono ancora prenotare una visita a domicilio con questo veterinario.", "No area yet: clients cannot book a home visit with this vet.", "Sin zona: los clientes aún no pueden reservar una visita a domicilio con este veterinario.", "Brak obszaru: klienci nie mogą jeszcze zarezerwować wizyty domowej."],
  noSvc: ["Ce vétérinaire n'a pas de consultation « à domicile » active.", "Questo veterinario non ha una visita «a domicilio» attiva.", "This vet has no active home-visit consultation.", "Este veterinario no tiene una consulta «a domicilio» activa.", "Ten weterynarz nie ma aktywnej wizyty domowej."],
  dbOld: ["La base de données doit être mise à jour (fichier SQL envoyé par Televet).", "Il database va aggiornato (file SQL inviato da Televet).", "The database must be updated (SQL file sent by Televet).", "Hay que actualizar la base de datos (archivo SQL enviado por Televet).", "Bazę danych trzeba zaktualizować (plik SQL od Televet)."],
  invalid: ["Zone incomplète : choisissez une adresse dans la liste et un rayon, ou saisissez des codes postaux.", "Zona incompleta: scegli un indirizzo dall'elenco e un raggio, oppure scrivi dei CAP.", "Incomplete area: pick an address from the list and a radius, or type postal codes.", "Zona incompleta: elige una dirección de la lista y un radio, o escribe códigos postales.", "Niepełny obszar: wybierz adres z listy i promień albo wpisz kody."],
  confTitle: ["Confirmation des rendez-vous", "Conferma degli appuntamenti", "Confirming appointments", "Confirmación de citas", "Potwierdzanie wizyt"],
  confRule: ["Un vétérinaire dont l'agenda Google (ou iCal) est connecté reçoit des rendez-vous confirmés automatiquement. Sinon, il reçoit une demande à accepter.", "Un veterinario con Google Calendar (o iCal) collegato riceve appuntamenti confermati automaticamente. Altrimenti riceve una richiesta da accettare.", "A vet whose Google (or iCal) calendar is connected gets appointments confirmed automatically. Otherwise they receive a request to accept.", "Un veterinario con Google Calendar (o iCal) conectado recibe citas confirmadas automáticamente. Si no, recibe una solicitud para aceptar.", "Weterynarz z połączonym Kalendarzem Google (lub iCal) dostaje wizyty potwierdzone automatycznie. Inaczej dostaje prośbę do akceptacji."],
  confAll: ["Confirmer automatiquement aussi sans agenda connecté", "Conferma automaticamente anche senza agenda collegata", "Also confirm automatically without a connected calendar", "Confirmar automáticamente también sin agenda conectada", "Potwierdzaj automatycznie także bez połączonego kalendarza"],
  calOn: ["Agenda connecté : confirmation automatique", "Agenda collegata: conferma automatica", "Calendar connected: automatic confirmation", "Agenda conectada: confirmación automática", "Kalendarz połączony: automatyczne potwierdzenie"],
  calOff: ["Pas d'agenda connecté : demandes à accepter", "Nessuna agenda collegata: richieste da accettare", "No calendar connected: requests to accept", "Sin agenda conectada: solicitudes para aceptar", "Brak kalendarza: prośby do akceptacji"],
  min: ["min", "min", "min", "min", "min"], none: ["aucun", "nessuno", "none", "ninguno", "brak"],
};

export default function HomeVisits({ lang, vetId, token }: { lang: string; vetId?: string; token: () => Promise<string> }) {
  const i = Math.max(0, (L as readonly string[]).indexOf(lang)), en = 2;
  const t = (k: string) => S[k]?.[(L as readonly string[]).includes(lang) ? i : en] ?? k;
  const [data, setData] = useState<Data | null>(null), [msg, setMsg] = useState<{ m: string; bad?: boolean } | null>(null), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"radius" | "postal">("radius"), [q, setQ] = useState(""), [place, setPlace] = useState<Place | null>(null), [opts, setOpts] = useState<Place[]>([]);
  const [km, setKm] = useState("10"), [codes, setCodes] = useState(""), [wide, setWide] = useState(false), [wKm, setWKm] = useState("20"), [wCodes, setWCodes] = useState(""), [fee, setFee] = useState(""), [travel, setTravel] = useState(30);

  const call = useCallback(async (method: "GET" | "PUT", body?: object) => {
    const r = await fetch("/api/pro/home-visits", { method, headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? String(r.status));
    return j as Data;
  }, [token]);

  const fill = useCallback((d: Data) => {
    setData(d);
    const v = d.vets.find((x) => x.id === vetId); if (!v) return;
    setTravel(v.travelMin);
    const z = v.zone;
    if (z?.mode === "postal") { setMode("postal"); setCodes(z.codes.join(", ")); setWide(!!z.extended); setWCodes(z.extended?.codes.join(", ") ?? ""); setFee(z.extended ? String(z.extended.feeCents / 100) : ""); }
    else if (z?.mode === "radius") { setMode("radius"); setPlace({ label: z.label, lat: z.lat, lng: z.lng }); setQ(z.label); setKm(String(z.km)); setWide(!!z.extended); setWKm(String(z.extended?.km ?? z.km * 2)); setFee(z.extended ? String(z.extended.feeCents / 100) : ""); }
  }, [vetId]);
  useEffect(() => { call("GET").then(fill).catch((e) => setMsg({ m: e.message, bad: true })); }, [call, fill]);

  useEffect(() => { // address suggestions
    if (!data || mode !== "radius" || q.trim().length < 4 || q === place?.label) { setOpts([]); return; }
    const h = setTimeout(() => fetch(`/api/places?q=${encodeURIComponent(q)}&country=${data.country}&lang=${lang}`).then((r) => r.json()).then((j) => setOpts(j.places ?? [])).catch(() => setOpts([])), 350);
    return () => clearTimeout(h);
  }, [q, mode, data, place, lang]);

  const errText = (e: string) => (e === "invalid_zone" ? t("invalid") : e === "database_not_updated" ? t("dbOld") : e);
  async function save(remove = false) {
    setBusy(true); setMsg(null);
    const feeCents = Math.round((Number(fee.replace(",", ".")) || 0) * 100);
    const zone = remove ? null : mode === "radius"
      ? { mode, label: place?.label ?? "", lat: place?.lat, lng: place?.lng, km: Number(km.replace(",", ".")), extended: wide ? { km: Number(wKm.replace(",", ".")), feeCents } : null }
      : { mode, codes, extended: wide ? { codes: wCodes, feeCents } : null };
    try { fill(await call("PUT", { practitionerId: vetId, travelMin: travel, zone })); setMsg({ m: t("saved") }); }
    catch (e) { setMsg({ m: errText((e as Error).message), bad: true }); }
    setBusy(false);
  }
  async function setAuto(on: boolean) { try { setData(await call("PUT", { autoConfirm: on })); setMsg({ m: t("saved") }); } catch (e) { setMsg({ m: errText((e as Error).message), bad: true }); } }

  if (!data) return <p>{msg ? <span className="alert">{msg.m}</span> : "…"}</p>;
  const v = data.vets.find((x) => x.id === vetId);
  const bbox = place ? (() => { const r = Number(km) || 10, dLat = r / 111, dLng = r / (111 * Math.cos((place.lat * Math.PI) / 180)); return `${place.lng - dLng},${place.lat - dLat},${place.lng + dLng},${place.lat + dLat}`; })() : "";

  return <div>
    {!data.ready && <p className="alert">{t("dbOld")}</p>}
    {!vetId ? null : !v ? null : <>
      <h2>{t("title")}</h2>
      {!v.hasHomeService && <p className="alert">{t("noSvc")}</p>}
      {!v.zone && <p className="alert">{t("noZone")}</p>}
      <div className="panel">
        <h3>{t("area")}</h3>
        <div className="days"><label><input type="radio" checked={mode === "radius"} onChange={() => setMode("radius")} />{t("byRadius")}</label><label><input type="radio" checked={mode === "postal"} onChange={() => setMode("postal")} />{t("byPostal")}</label></div>
        {mode === "radius" ? <>
          <label className="label">{t("start")}</label>
          <input className="field" value={q} autoComplete="off" onChange={(e) => { setQ(e.target.value); setPlace(null); }} />
          {opts.length > 0 && <ul className="menu-list">{opts.map((o) => <li key={`${o.lat},${o.lng}`}><button onClick={() => { setPlace(o); setQ(o.label); setOpts([]); }}>{o.label}</button></li>)}</ul>}
          <label className="label">{t("km")}</label><input className="field" style={{ maxWidth: 140 }} inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} />
          {place && <iframe title={t("area")} style={{ width: "100%", height: 260, border: "1px solid var(--line)", borderRadius: 12, marginTop: 12 }} loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${place.lat},${place.lng}`} />}
        </> : <>
          <label className="label">{t("codes")}</label><textarea className="field" style={{ minHeight: 70 }} value={codes} onChange={(e) => setCodes(e.target.value)} />
        </>}
        <label style={{ display: "block", margin: "14px 0 4px" }}><input type="checkbox" checked={wide} onChange={(e) => setWide(e.target.checked)} /> {t("wider")}</label>
        {wide && <div className="grid2">
          {mode === "radius" ? <div><label className="label">{t("widerKm")}</label><input className="field" inputMode="decimal" value={wKm} onChange={(e) => setWKm(e.target.value)} /></div>
            : <div><label className="label">{t("widerCodes")}</label><input className="field" value={wCodes} onChange={(e) => setWCodes(e.target.value)} /></div>}
          <div><label className="label">{t("fee")} ({data.currency})</label><input className="field" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} /></div></div>}
      </div>
      <div className="panel">
        <h3>{t("travel")}</h3><p><small>{t("travelHelp")}</small></p>
        <select className="field" style={{ maxWidth: 200 }} value={travel} onChange={(e) => setTravel(Number(e.target.value))}>{[...new Set([...TRAVEL_CHOICES, travel])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n ? `${n} ${t("min")}` : t("none")}</option>)}</select>
      </div>
      <p><button className="btn" disabled={busy} onClick={() => save()}>{t("save")}</button> {v.zone && <button className="btn btn-quiet" disabled={busy} onClick={() => save(true)}>{t("remove")}</button>}</p>
    </>}
    <div className="panel"><h3>{t("confTitle")}</h3><p><small>{t("confRule")}</small></p>
      {v && <p><span className={`chip ${v.calendarConnected ? "ok" : "wait"}`}>{v.calendarConnected ? t("calOn") : t("calOff")}</span></p>}
      <label><input type="checkbox" checked={data.autoConfirm} onChange={(e) => setAuto(e.target.checked)} /> {t("confAll")}</label></div>
    {msg && <p role="status" className={msg.bad ? "alert" : "ok-text"}>{msg.m}</p>}
  </div>;
}
