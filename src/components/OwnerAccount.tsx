"use client";
import JoinVideo from "@/components/JoinVideo";
import { useEffect, useState } from "react";
import { signInWithProvider, signOut, supabaseBrowser } from "@/lib/auth-client";
import { VI } from "@/components/VI";

const T = {
  fr: { title: "Mon compte", login: "Connectez-vous pour voir vos rendez-vous", google: "Continuer avec Google", apple: "Continuer avec Apple", bookings: "Mes rendez-vous", none: "Aucun rendez-vous pour le moment.", pets: "Mes animaux", noPets: "Aucun animal enregistré.", add: "Ajouter", name: "Nom", out: "Se déconnecter", st: { pending: "En attente", confirmed: "Confirmé", declined: "Refusé", cancelled: "Annulé" }, sp: { dog: "Chien", cat: "Chat", rabbit: "Lapin", ferret: "Furet", bird: "Oiseau", horse: "Cheval", other: "Autre" } },
  it: { title: "Il mio account", login: "Accedi per vedere i tuoi appuntamenti", google: "Continua con Google", apple: "Continua con Apple", bookings: "I miei appuntamenti", none: "Nessun appuntamento al momento.", pets: "I miei animali", noPets: "Nessun animale registrato.", add: "Aggiungi", name: "Nome", out: "Esci", st: { pending: "In attesa", confirmed: "Confermato", declined: "Rifiutato", cancelled: "Annullato" }, sp: { dog: "Cane", cat: "Gatto", rabbit: "Coniglio", ferret: "Furetto", bird: "Uccello", horse: "Cavallo", other: "Altro" } },
  en: { title: "My account", login: "Sign in to see your appointments", google: "Continue with Google", apple: "Continue with Apple", bookings: "My appointments", none: "No appointments yet.", pets: "My pets", noPets: "No pets saved.", add: "Add", name: "Name", out: "Sign out", st: { pending: "Pending", confirmed: "Confirmed", declined: "Declined", cancelled: "Cancelled" }, sp: { dog: "Dog", cat: "Cat", rabbit: "Rabbit", ferret: "Ferret", bird: "Bird", horse: "Horse", other: "Other" } },
  es: { title: "Mi cuenta", login: "Entra para ver tus citas", google: "Continuar con Google", apple: "Continuar con Apple", bookings: "Mis citas", none: "Aún no hay citas.", pets: "Mis mascotas", noPets: "No hay mascotas guardadas.", add: "Añadir", name: "Nombre", out: "Cerrar sesión", st: { pending: "Pendiente", confirmed: "Confirmada", declined: "Rechazada", cancelled: "Cancelada" }, sp: { dog: "Perro", cat: "Gato", rabbit: "Conejo", ferret: "Hurón", bird: "Ave", horse: "Caballo", other: "Otro" } },
} as const;
type L = keyof typeof T;
interface B { id: string; starts_at: string; ends_at: string; type: string; status: keyof typeof T["fr"]["st"]; practices: { name: string } | null; pets: { name: string } | null }
interface P { id: string; name: string; species: string }
const CARNET: Record<string, string> = { fr: "Carnet de santé", it: "Libretto sanitario", en: "Health record", es: "Cartilla sanitaria" };
const ICON: Record<string, string> = { video: "monitor", home: "housePaw", clinic: "clinic", expertise: "stethoscope" };
const PET: Record<string, string> = { dog: "dog", cat: "cat", rabbit: "rabbit", bird: "bird", ferret: "paw", horse: "paw", other: "paw" };

export default function OwnerAccount({ lang }: { lang: string }) {
  const t = T[(lang in T ? lang : "en") as L];
  const [user, setUser] = useState<boolean | null>(null);
  const [bookings, setBookings] = useState<B[]>([]);
  const [pets, setPets] = useState<P[]>([]);
  const [name, setName] = useState(""); const [species, setSpecies] = useState("dog");
  async function load() {
    const sb = supabaseBrowser();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return setUser(false);
    setUser(true);
    const [b, p] = await Promise.all([
      sb.from("bookings").select("id, starts_at, ends_at, type, status, practices(name), pets(name)").order("starts_at", { ascending: false }).limit(50),
      sb.from("pets").select("id, name, species").order("created_at"),
    ]);
    setBookings((b.data as unknown as B[]) ?? []); setPets(p.data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function addPet() {
    const sb = supabaseBrowser(); const { data: u } = await sb.auth.getUser(); if (!u.user || !name.trim()) return;
    await sb.from("owners").upsert({ id: u.user.id, full_name: "", language: lang }, { onConflict: "id", ignoreDuplicates: true });
    await sb.from("pets").insert({ owner_id: u.user.id, name: name.trim(), species }); setName(""); load();
  }
  const fmt = (d: string) => new Date(d).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" });
  if (user === null) return <p>…</p>;
  if (!user) return <section><h2>{t.login}</h2><div className="oauth">
    <button className="btn btn-ghost oauth-btn" onClick={() => signInWithProvider("google", window.location.pathname)}>{t.google}</button>
    <button className="btn btn-ghost oauth-btn" onClick={() => signInWithProvider("apple", window.location.pathname)}>{t.apple}</button></div></section>;
  return <div>
    <section><h2>{t.bookings}</h2>
      {bookings.length === 0 ? <p>{t.none}</p> : <ul className="acct-list">{bookings.map((b) => <li key={b.id}>
        <span className="ico sm"><VI n={ICON[b.type] ?? "calendar"} size={30} /></span>
        <span><strong>{b.practices?.name}</strong><br /><small>{fmt(b.starts_at)}{b.pets?.name ? ` · ${b.pets.name}` : ""}</small></span>
        <span className={`pill st-${b.status}`}>{t.st[b.status]}</span>{b.status === "confirmed" && (b.type === "video" || b.type === "expertise") && new Date(b.ends_at).getTime() + 3600000 > Date.now() && <JoinVideo bookingId={b.id} lang={lang} />}</li>)}</ul>}
    </section>
    <section><h2>{t.pets}</h2>
      {pets.length === 0 ? <p>{t.noPets}</p> : <ul className="acct-list">{pets.map((p) => <li key={p.id}><span className="ico sm"><VI n={PET[p.species] ?? "paw"} size={30} /></span><span><strong>{p.name}</strong><br /><small>{(t.sp as Record<string, string>)[p.species]}</small></span><a className="btn btn-ghost" style={{ marginLeft: "auto" }} href={`/${lang}/${typeof window !== "undefined" ? window.location.pathname.split("/")[2] || lang : lang}/compte/animal/${p.id}`}>{CARNET[lang] ?? CARNET.en}</a></li>)}</ul>}
      <div className="row" style={{ marginTop: 8 }}><input className="field" placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} />
        <select className="field" value={species} onChange={(e) => setSpecies(e.target.value)}>{Object.entries(t.sp).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn" onClick={addPet} disabled={!name.trim()}>{t.add}</button></div>
    </section>
    <p><button className="btn btn-quiet" onClick={async () => { await signOut(); setUser(false); }}>{t.out}</button></p>
  </div>;
}
