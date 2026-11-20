import { useEffect, useImperativeHandle, useRef, type ComponentClass, type Ref } from "react";
import { View } from "react-native";
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";
import { API_URL } from "@/lib/config";
import { sanitizeProposals } from "@/lib/health";
import type { Proposal } from "@/lib/types";

// the library's own typing of its props does not compile under strict TypeScript: give the component its documented props
const WebView = RNWebView as unknown as ComponentClass<WebViewProps>;

export type BookletReaderHandle = {
  /** Reads a booklet photo (base64 JPEG) on the phone. Resolves with the dated entries found, or null when reading was not possible. */
  read: (base64Jpeg: string, lang: string) => Promise<Proposal[] | null>;
};

/**
 * On-device reading of a health-booklet photo, free and without any external service: an invisible web view runs the same
 * open-source reader as the Televet website (page /m/ocr). The photo goes from the app to that page inside the phone and is never uploaded by it.
 * The first reading downloads the language data (about 15 MB), which the phone then keeps.
 */
export function BookletReader({ ref }: { ref?: Ref<BookletReaderHandle> }) {
  const web = useRef<RNWebView<object>>(null), ready = useRef(false), queue = useRef<string[]>([]);
  const waiting = useRef(new Map<string, (p: Proposal[] | null) => void>());
  const failAll = () => { waiting.current.forEach((done) => done(null)); waiting.current.clear(); queue.current = []; };
  useEffect(() => failAll, []); // leaving the screen: nobody waits forever

  useImperativeHandle(ref, () => ({
    read(base64Jpeg, lang) {
      return new Promise<Proposal[] | null>((resolve) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const timer = setTimeout(() => { waiting.current.delete(id); resolve(null); }, 150000);
        waiting.current.set(id, (p) => { clearTimeout(timer); resolve(p); });
        const msg = JSON.stringify({ type: "read", id, lang, image: base64Jpeg });
        if (ready.current) web.current?.postMessage(msg); else queue.current.push(msg);
      });
    },
  }), []);

  const onMessage = (e: WebViewMessageEvent) => {
    let d: { type?: string; id?: string; proposals?: unknown };
    try { d = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (d.type === "ready") { ready.current = true; queue.current.splice(0).forEach((m) => web.current?.postMessage(m)); return; }
    if ((d.type === "result" || d.type === "error") && d.id) {
      const done = waiting.current.get(d.id); waiting.current.delete(d.id);
      done?.(d.type === "result" ? sanitizeProposals(d.proposals) : null);
    }
  };

  return (
    <View style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView ref={web} source={{ uri: `${API_URL}/m/ocr` }} onMessage={onMessage} onError={failAll} onHttpError={failAll} javaScriptEnabled domStorageEnabled cacheEnabled originWhitelist={["https://*"]} />
    </View>
  );
}
