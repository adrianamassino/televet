import { VI } from "@/components/VI";
import { CATEGORIES, COMMON, categoryOf, speciesName } from "@/lib/species";
import { hoursByDay, type PC } from "@/lib/profile-copy";

/** Small server components shared by the clinic and vet pages. */
export function Hours({ t, rules }: { t: PC; rules: { weekday: number; start_time: string; end_time: string }[] }) {
  const rows = hoursByDay(rules); const today = new Date().getDay();
  return <table className="hours"><tbody>{rows.map((r) => <tr key={r.day} className={r.day === today ? "today" : ""}><th scope="row">{t.days[r.day]}</th><td>{r.ranges || <span className="muted">{t.closed}</span>}</td></tr>)}</tbody></table>;
}

export function Chips({ items, map, icon }: { items: string[]; map?: Record<string, string>; icon?: string }) {
  return <ul className="chips">{items.map((k) => <li key={k}>{icon && <VI n={icon} size={22} />}{map?.[k] ?? k}</li>)}</ul>;
}

export const SPECIES_ICON: Record<string, string> = { dog: "dog", cat: "cat", rabbit: "rabbit", bird: "bird", ferret: "paw", horse: "paw", reptile: "turtle", rodent: "hamster", other: "paw" };
/** Icon of an animal, or of its category for animals added later (guinea pig → rodent…). */
export const speciesIcon = (k: string) => SPECIES_ICON[k] ?? SPECIES_ICON[categoryOf(k) ?? ""] ?? "paw";
/** Animals treated: common ones first, categories ("Rodents") or the chosen members ("Rodents (guinea pigs, hamsters)"). */
export function Animals({ lang, items }: { lang: string; items: string[] }) {
  const order = [...COMMON, ...CATEGORIES.flatMap((c) => [c.code, ...c.members]), "other"];
  const shown = items.filter((k) => !categoryOf(k) || !items.includes(categoryOf(k)!)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return <ul className="animal-tiles">{shown.map((k) => <li key={k}><span className="ico"><VI n={speciesIcon(k)} size={40} /></span>{speciesName(k, lang, true)}</li>)}</ul>;
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="profile-section"><h2>{title}</h2>{children}</section>;
}

export function Avatar({ src, name, size = 72 }: { src?: string | null; name: string; size?: number }) {
  const ini = name.replace(/^(dr|dre|dott\.?|dra\.?)\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  /* eslint-disable-next-line @next/next/no-img-element */
  return src ? <img className="p-avatar" src={src} alt={name} width={size} height={size} style={{ width: size, height: size }} /> : <span className="p-avatar ph" aria-hidden style={{ width: size, height: size, fontSize: size / 2.6 }}>{ini}</span>;
}

export const mapsUrl = (q: string) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`;
