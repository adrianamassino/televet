"use client";
import { useEffect, useState } from "react";
import { ocrText } from "@/lib/pet-ocr";
import { parseBookletText } from "@/lib/pet-ocr-parse";

/**
 * Reading of a health-booklet photo for the mobile app, on the phone itself.
 * The app keeps this page in an invisible web view and sends it the photo; the page runs the same open-source reader
 * as the website (Tesseract.js, served from /ocr) and answers with the dated entries it found. Nothing is uploaded.
 *   app → page : { type: "read", id, lang, image: "<base64 JPEG>" }
 *   page → app : { type: "ready" } · { type: "result", id, proposals, chars } · { type: "error", id }
 */
type Bridge = { postMessage: (m: string) => void };
const bridge = () => (window as unknown as { ReactNativeWebView?: Bridge }).ReactNativeWebView;

export default function AppOcr() {
  const [state, setState] = useState("ready");
  useEffect(() => {
    const post = (m: unknown) => bridge()?.postMessage(JSON.stringify(m));
    let chain: Promise<void> = Promise.resolve(); // one photo at a time
    const onMessage = (ev: Event) => {
      const raw = (ev as MessageEvent).data;
      let d: { type?: string; id?: string; lang?: string; image?: string };
      try { d = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return; }
      if (!d || d.type !== "read" || typeof d.image !== "string" || typeof d.id !== "string") return;
      const { id, image, lang } = d as { id: string; image: string; lang?: string };
      chain = chain.then(async () => {
        setState("reading");
        try {
          const bin = atob(image.replace(/^data:[^,]*,/, ""));
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const text = await ocrText(new Blob([bytes], { type: "image/jpeg" }), (lang ?? "en").slice(0, 2));
          post({ type: "result", id, proposals: parseBookletText(text), chars: text.trim().length });
        } catch { post({ type: "error", id }); }
        setState("ready");
      });
    };
    window.addEventListener("message", onMessage);        // iOS
    document.addEventListener("message", onMessage);      // Android
    post({ type: "ready" });
    return () => { window.removeEventListener("message", onMessage); document.removeEventListener("message", onMessage); };
  }, []);
  return <p data-state={state} style={{ margin: 16, font: "14px system-ui", color: "#4a5a8a" }}>Televet</p>;
}
