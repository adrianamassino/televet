/** Decorative strip of cut-out photos on coloured shapes (files in /public/photos/cut). */
const SETS: Record<string, string[]> = {
  a: ["vet-chihuahua", "girl-cat", "vet-exam"],
  b: ["vet-exam", "vet-chihuahua", "girl-cat"],
  c: ["girl-cat", "vet-exam", "vet-chihuahua"],
};
export function PhotoStrip({ set = "a" }: { set?: keyof typeof SETS | string }) {
  return <div className="photo-strip" aria-hidden>{(SETS[set] ?? SETS.a).map((n) => <span key={n} className="pop"><img src={`/photos/cut/${n}.webp`} alt="" loading="lazy" /></span>)}</div>;
}
