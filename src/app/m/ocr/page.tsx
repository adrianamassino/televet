import type { Metadata } from "next";
import AppOcr from "@/components/AppOcr";

export const metadata: Metadata = { title: "Televet", robots: { index: false, follow: false } };
/** Invisible helper page of the mobile app (see AppOcr). */
export default function Page() { return <AppOcr />; }
