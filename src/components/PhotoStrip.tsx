/** Photo strip: three full photos in matching rounded frames (files in /public/photos). */
const SETS: Record<string, string[]> = {
  a: ["vet-chihuahua", "vet-family", "vet-exam"],
  b: ["vet-dachshund", "vet-white-cat", "vet-chihuahua"],
  c: ["vet-exam", "vet-dachshund", "vet-family"],
};
export function PhotoStrip({ set = "a" }: { set?: keyof typeof SETS | string }) {
  return <div className="photo-strip" aria-hidden>{(SETS[set] ?? SETS.a).map((n) => <span key={n} className="ps"><img src={`/photos/${n}.jpg`} alt="" loading="lazy" /></span>)}</div>;
}
