import { vetIconMarkup } from "@/lib/vet-icons";

/** Duotone veterinary icon (see lib/vet-icons.ts). */
export function VI({ n, size = 48, tone = "duo", className }: { n: string; size?: number; tone?: "duo" | "white" | "ghost"; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke={tone === "duo" ? "#0b5ea8" : tone === "white" ? "#fff" : "#bfe6ff"} strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: vetIconMarkup(n, tone) }} />;
}
