import type { Metadata } from "next";
import AppPay from "@/components/AppPay";

export const metadata: Metadata = { title: "Televet", robots: { index: false, follow: false } };
/** Payment page for the mobile apps (see AppPay). */
export default function Page() { return <AppPay stripeKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} />; }
