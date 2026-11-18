/** Decorative strip of cute-animal photos (files in /public/photos). */
const SETS: Record<string, string[]> = {
  a: ["vet-chihuahua", "vet-white-cat", "vet-pomeranian"],
  b: ["vet-cat", "vet-dachshund", "nurse-cat"],
  c: ["girl-cat", "vet-chihuahua", "vet-exam"],
};
export function PhotoStrip({ set = "a" }: { set?: keyof typeof SETS | string }) {
  return <div className="photo-strip" aria-hidden>{(SETS[set] ?? SETS.a).map((n) => <img key={n} src={`/photos/${n}.jpg`} alt="" loading="lazy" />)}</div>;
}
