import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import type { CopyKey } from "@/copy";
import { api, ApiError } from "./api";
import { dateTime } from "./format";
import type { ServiceType, VideoAccess } from "./types";
import type { IconName } from "@/components/ui";

type TFn = (key: CopyKey, vars?: Record<string, string | number>) => string;

export const TYPE_ICON: Record<ServiceType, IconName> = { video: "video-outline", home: "home-heart", clinic: "hospital-building", expertise: "stethoscope" };
export const SPECIES = ["dog", "cat", "rabbit", "ferret", "bird", "horse", "other"] as const;
export const SPECIES_ICON: Record<string, IconName> = { dog: "dog", cat: "cat", rabbit: "rabbit", bird: "bird", ferret: "paw", horse: "horse", other: "paw" };
export const typeKey = (type: string): CopyKey => (`t_${["video", "home", "clinic", "expertise"].includes(type) ? type : "clinic"}`) as CopyKey;
export const speciesKey = (s: string): CopyKey => (`sp_${(SPECIES as readonly string[]).includes(s) ? s : "other"}`) as CopyKey;
export const flag = (cc: string) => String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));

/** In-app browser (payment page, legal pages, the site). Falls back to the phone's browser. */
export async function openWeb(url: string): Promise<void> {
  try { await WebBrowser.openBrowserAsync(url, { controlsColor: "#0A3FD6", toolbarColor: "#FFFFFF" }); }
  catch { Linking.openURL(url).catch(() => {}); }
}
export const callPhone = (phone: string) => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`).catch(() => {});
export const sendMail = (email: string) => Linking.openURL(`mailto:${email}`).catch(() => {});
/** Opens directions to the address in Google Maps (the app if installed, otherwise the browser). */
export const openMap = (address: string) => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`).catch(() => {});

/**
 * Opens the video room of a booking. Returns nothing when it opened, otherwise the sentence to show
 * (too early, finished, not confirmed…). The room opens 15 minutes before the appointment.
 */
export async function openVideo(bookingId: string, t: TFn, lang: string): Promise<string | null> {
  try {
    const a = await api<VideoAccess>(`/api/bookings/${bookingId}/video`);
    if (a.ok) {
      // Televet's own rooms open inside the app; a vet's personal link (Zoom, Meet…) is handed to the phone so its app can take over
      if (/(^|\.)daily\.co$/i.test(hostOf(a.url))) await openWeb(a.url); else await Linking.openURL(a.url);
      return null;
    }
    if (a.reason === "too_early" && a.opensAt) return t("videoEarly", { t: dateTime(a.opensAt, lang) });
    return t(a.reason === "closed" ? "videoClosed" : a.reason === "not_confirmed" ? "videoNotConfirmed" : "videoErr");
  } catch (e) { return t(e instanceof ApiError && e.code === "network" ? "netErr" : "videoErr"); }
}
const hostOf = (url: string) => { try { return new URL(url).hostname; } catch { return ""; } };

/** True while the "join" button makes sense: from 15 minutes before the start until an hour after the end. */
export const videoWindow = (startsAt: string, endsAt: string, now = Date.now()) => now >= Date.parse(startsAt) - 15 * 60000 && now <= Date.parse(endsAt) + 60 * 60000;

export const apiMessage = (e: unknown, t: TFn): string => (e instanceof ApiError && e.code === "network" ? t("netErr") : t("genericErr"));
