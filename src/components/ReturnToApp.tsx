"use client";
import { useEffect } from "react";

/** Sends the visitor back into the Televet mobile app (link scheme) as soon as the page opens; the button is the fallback. */
export default function ReturnToApp({ url, label }: { url: string; label: string }) {
  useEffect(() => { window.location.replace(url); }, [url]);
  return <a href={url} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52, borderRadius: 999, background: "linear-gradient(135deg,#0a2a9c,#0a3fd6 55%,#1e7bff)", color: "#fff", font: "600 17px var(--body)", textDecoration: "none" }}>{label}</a>;
}
