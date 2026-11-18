import { VI } from "@/components/VI";
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
export function Animals({ t, items }: { t: PC; items: string[] }) {
  return <ul className="animal-tiles">{items.map((k) => <li key={k}><span className="ico"><VI n={SPECIES_ICON[k] ?? "paw"} size={40} /></span>{t.sp[k] ?? k}</li>)}</ul>;
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
