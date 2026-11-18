/** Duotone veterinary icon set (64×64 grid). Tokens: S = stroke, F = soft fill, A = accent fill. */
const PAW = (cx: number, cy: number, s: number) =>
  `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-32 -32)" fill="A" stroke="none"><path d="M32 30c-7 0-13 7-13 12 0 5 4 7 8 6 2-.6 3.200-1.600 5-1.600s3 1 5 1.600c4 1 8-1 8-6 0-5-6-12-13-12z"/><ellipse cx="17" cy="27" rx="4.500" ry="6" transform="rotate(-20 17 27)"/><ellipse cx="26" cy="17" rx="4.500" ry="6.500"/><ellipse cx="38" cy="17" rx="4.500" ry="6.500"/><ellipse cx="47" cy="27" rx="4.500" ry="6" transform="rotate(20 47 27)"/></g>`;
const HEART = `M32 56C14 44 8 34 8 24c0-7 5-12 12-12 5 0 9 3 12 7 3-4 7-7 12-7 7 0 12 5 12 12 0 10-6 20-24 32z`;

export const VET_ICONS: Record<string, string> = {
  paw: PAW(32, 32, 1),
  pawHeart: `<path d="${HEART}" fill="F"/>${PAW(32, 31, .5)}`,
  heartPulse: `<path d="${HEART}" fill="F"/><path d="M14 32h10l4-8 6 16 4-8h12" fill="none"/>`,
  cross: `<path d="M24 8h16v16h16v16H40v16H24V40H8V24h16z" fill="A"/>`,
  stethoscope: `<path d="M16 8h8M40 8h8M20 8v14a12 12 0 0 0 24 0V8" fill="none"/><path d="M32 34v8a12 12 0 0 0 24 0v-6" fill="none"/><circle cx="56" cy="30" r="5" fill="A"/>`,
  syringe: `<g transform="rotate(-45 32 32)"><rect x="14" y="25" width="28" height="14" rx="2" fill="F"/><path d="M22 25v5M28 25v5M34 25v5M14 32H6M6 26v12M42 22v20M42 32h14" fill="none"/><rect x="14" y="25" width="10" height="14" fill="A" stroke="none" opacity=".55"/></g>`,
  bottle: `<rect x="22" y="6" width="20" height="9" rx="2.500" fill="A"/><rect x="17" y="15" width="30" height="43" rx="7" fill="F"/>${PAW(32, 38, .42)}`,
  pill: `<g transform="rotate(-40 32 32)"><rect x="8" y="22" width="48" height="20" rx="10" fill="F"/><path d="M32 22h14a10 10 0 0 1 0 20H32z" fill="A" stroke="none" opacity=".75"/><rect x="8" y="22" width="48" height="20" rx="10" fill="none"/><path d="M32 22v20" fill="none"/></g>`,
  thermometer: `<rect x="26" y="6" width="12" height="38" rx="6" fill="F"/><circle cx="32" cy="49" r="9" fill="F"/><circle cx="32" cy="49" r="4.500" fill="A" stroke="none"/><path d="M32 42V20M42 14h6M42 22h6M42 30h6" fill="none"/>`,
  bandage: `<g transform="rotate(-40 32 32)"><rect x="4" y="21" width="56" height="22" rx="11" fill="F"/><rect x="22" y="21" width="20" height="22" fill="A" stroke="none" opacity=".6"/><rect x="22" y="21" width="20" height="22" fill="none"/><circle cx="14" cy="29" r="1.200" fill="S" stroke="none"/><circle cx="14" cy="35" r="1.200" fill="S" stroke="none"/><circle cx="50" cy="29" r="1.200" fill="S" stroke="none"/><circle cx="50" cy="35" r="1.200" fill="S" stroke="none"/></g>`,
  bone: `<g transform="rotate(-35 32 32)"><circle cx="13" cy="25" r="7" fill="F"/><circle cx="13" cy="39" r="7" fill="F"/><circle cx="51" cy="25" r="7" fill="F"/><circle cx="51" cy="39" r="7" fill="F"/><rect x="13" y="25" width="38" height="14" fill="F" stroke="none"/><path d="M18 25h28M18 39h28" fill="none"/></g>`,
  bowl: `<path d="M26 26c0-8 6-12 12-8 4-4 12 0 10 8z" fill="A" stroke="none" opacity=".8"/><path d="M8 28h48l-5 20a7 7 0 0 1-7 6H20a7 7 0 0 1-7-6z" fill="F"/>${PAW(32, 42, .32)}`,
  house: `<path d="M6 31 32 8l26 23v25H6z" fill="F"/><path d="M26 56V42a6 6 0 0 1 12 0v14" fill="none"/>${PAW(32, 33, .3)}`,
  housePaw: `<path d="M6 31 32 8l26 23v25H6z" fill="F"/>${PAW(32, 38, .55)}`,
  carrier: `<path d="M24 16a8 8 0 0 1 16 0" fill="none"/><rect x="8" y="16" width="48" height="36" rx="8" fill="F"/><rect x="34" y="24" width="16" height="20" rx="3" fill="none"/><path d="M38 24v20M42 24v20M46 24v20M14 24h14M14 30h14M14 36h14" fill="none"/>`,
  dog: `<path d="M18 16c-9-2-13 5-12 16 1 6 6 6 8 2l3-15z" fill="A" opacity=".8"/><path d="M46 16c9-2 13 5 12 16-1 6-6 6-8 2l-3-15z" fill="A" opacity=".8"/><path d="M32 10c-10 0-16 8-16 20s6 24 16 24 16-12 16-24-6-20-16-20z" fill="F"/><circle cx="25" cy="30" r="2" fill="S" stroke="none"/><circle cx="39" cy="30" r="2" fill="S" stroke="none"/><ellipse cx="32" cy="38" rx="4.500" ry="3.200" fill="S" stroke="none"/><path d="M32 41v4c-2 3-6 3-8 0M32 45c2 3 6 3 8 0" fill="none"/>`,
  cat: `<path d="M10 10l12 8h20l12-8v28c0 10-9 16-22 16S10 48 10 38z" fill="F"/><path d="M10 10l12 8M54 10 42 18" fill="none"/><circle cx="24" cy="32" r="2.200" fill="S" stroke="none"/><circle cx="40" cy="32" r="2.200" fill="S" stroke="none"/><path d="M29.500 38h5L32 41z" fill="A"/><path d="M32 41v3M6 36l12 2M6 44l12-3M58 36 46 38M58 44l-12-3" fill="none"/>`,
  rabbit: `<ellipse cx="23" cy="16" rx="6" ry="14" fill="F"/><ellipse cx="41" cy="16" rx="6" ry="14" fill="F"/><ellipse cx="23" cy="17" rx="2.500" ry="8" fill="A" stroke="none" opacity=".6"/><ellipse cx="41" cy="17" rx="2.500" ry="8" fill="A" stroke="none" opacity=".6"/><ellipse cx="32" cy="42" rx="19" ry="16" fill="F"/><circle cx="25" cy="40" r="2" fill="S" stroke="none"/><circle cx="39" cy="40" r="2" fill="S" stroke="none"/><path d="M30 46h4l-2 3z" fill="A"/><path d="M32 49c-1 3-4 3-5 1M32 49c1 3 4 3 5 1" fill="none"/>`,
  hamster: `<circle cx="17" cy="16" r="6" fill="A" opacity=".7"/><circle cx="47" cy="16" r="6" fill="A" opacity=".7"/><ellipse cx="32" cy="36" rx="23" ry="20" fill="F"/><circle cx="24" cy="32" r="2" fill="S" stroke="none"/><circle cx="40" cy="32" r="2" fill="S" stroke="none"/><path d="M30 38h4l-2 3z" fill="A"/><path d="M32 41c-1 3-4 3-5 1M32 41c1 3 4 3 5 1" fill="none"/>`,
  bird: `<path d="M10 40c0-12 8-22 20-22 6 0 10 3 12 8l12 4-12 4c-1 10-8 18-18 18-8 0-14-5-14-12z" fill="F"/><path d="M20 38c4-6 12-6 16 2-6 6-14 6-16-2z" fill="A" opacity=".8"/><circle cx="37" cy="26" r="1.800" fill="S" stroke="none"/><path d="M26 56l-4 4M34 56l2 4" fill="none"/>`,
  turtle: `<path d="M10 42C10 29 20 21 32 21s22 8 22 21z" fill="F"/><path d="M22 42c0-8 4-14 10-17 6 3 10 9 10 17M32 25v17M14 36l8 2M50 36l-8 2" fill="none"/><circle cx="56" cy="38" r="5" fill="F"/><path d="M14 42l-2 8h8l2-8M42 42l2 8h8l-2-8" fill="A" opacity=".7"/>`,
  fish: `<path d="M6 32c8-14 24-16 36-4l14-10v28L42 36C30 48 14 46 6 32z" fill="F"/><circle cx="18" cy="30" r="2" fill="S" stroke="none"/><path d="M30 24c3 5 3 11 0 16" fill="none"/><circle cx="12" cy="14" r="2" fill="none"/><circle cx="19" cy="9" r="1.200" fill="none"/>`,
  calendar: `<rect x="8" y="12" width="48" height="44" rx="7" fill="F"/><path d="M8 25h48M20 6v10M44 6v10" fill="none"/>${PAW(32, 41, .42)}`,
  clipboard: `<rect x="13" y="10" width="38" height="48" rx="6" fill="F"/><rect x="24" y="5" width="16" height="10" rx="3" fill="A"/>${PAW(32, 36, .5)}<path d="M22 52h20" fill="none"/>`,
  monitor: `<rect x="5" y="9" width="54" height="36" rx="6" fill="F"/><path d="M24 55h16M32 45v10" fill="none"/>${PAW(32, 27, .5)}`,
  chat: `<path d="M10 12h44a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H30L18 58V46h-8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" fill="F"/>${PAW(32, 29, .45)}`,
  shield: `<path d="M32 5l21 8v17c0 14-9 23-21 29C20 53 11 44 11 30V13z" fill="F"/>${PAW(32, 31, .5)}`,
  vet: `<circle cx="32" cy="20" r="10" fill="F"/><path d="M10 58c0-13 9-20 22-20s22 7 22 20z" fill="F"/><path d="M24 40c0 8 4 12 8 12s8-4 8-12" fill="none"/><circle cx="32" cy="53" r="2.500" fill="A"/><path d="M22 18c0-6 5-8 10-8s10 2 10 8" fill="none"/>`,
  van: `<path d="M4 46V20a4 4 0 0 1 4-4h28v30z" fill="F"/><path d="M36 24h12l10 10v12H36z" fill="F"/><circle cx="18" cy="48" r="6" fill="A"/><circle cx="48" cy="48" r="6" fill="A"/>${PAW(20, 31, .36)}`,
  clinic: `<path d="M8 56V24l24-14 24 14v32z" fill="F"/><path d="M28 56V42h8v14" fill="none"/><path d="M29 22h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="A" stroke="none"/>`,
  magnifier: `<circle cx="27" cy="27" r="17" fill="F"/><path d="M40 40l16 16" fill="none" stroke-width="5"/>${PAW(27, 28, .4)}`,
  pin: `<path d="M32 58C18 42 14 34 14 26a18 18 0 0 1 36 0c0 8-4 16-18 32z" fill="F"/>${PAW(32, 27, .42)}`,
  microscope: `<path d="M26 8l10 4-6 14-10-4z" fill="F"/><path d="M33 22c10 2 16 10 14 20" fill="none"/><path d="M12 56h40M20 56c0-8 6-12 14-12" fill="none"/><circle cx="40" cy="44" r="0" fill="none"/><path d="M18 46h14" fill="none"/>`,
  leash: `<circle cx="32" cy="18" r="10" fill="F"/><path d="M24 24c-6 8-4 22 8 22s14-8 8-14" fill="none"/>${PAW(32, 18, .32)}`,
};

export type VetIconName = keyof typeof VET_ICONS;
/** Returns the inner markup with colour tokens resolved. */
export function vetIconMarkup(name: string, tone: "duo" | "white" | "ghost" = "duo") {
  const raw = VET_ICONS[name]; if (!raw) return "";
  const c = tone === "duo" ? { S: "#0b5ea8", F: "#c4f0ff", A: "#2aa8e0" } : tone === "white" ? { S: "#ffffff", F: "rgba(255,255,255,.18)", A: "rgba(255,255,255,.55)" } : { S: "#bfe6ff", F: "rgba(160,220,255,.12)", A: "rgba(160,220,255,.4)" };
  return raw.replace(/(stroke|fill)="(S|F|A)"/g, (_, k, t) => `${k}="${c[t as "S" | "F" | "A"]}"`);
}
