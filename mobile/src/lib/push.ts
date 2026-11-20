import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";
import { EAS_PROJECT_ID, VARIANT } from "./config";

const KEY = "tv.push.token";

// a notification that arrives while the app is open is still shown as a banner
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
}

export type PushState = "on" | "off" | "denied" | "unavailable";

export async function pushState(): Promise<PushState> {
  if (Platform.OS === "web" || !Device.isDevice || !EAS_PROJECT_ID) return "unavailable";
  try {
    const p = await Notifications.getPermissionsAsync();
    if (p.status === "granted") return (await AsyncStorage.getItem(KEY)) ? "on" : "off";
    return p.status === "denied" && !p.canAskAgain ? "denied" : "off";
  } catch { return "unavailable"; }
}

/**
 * Registers this phone for the signed-in account's notifications.
 * `ask` = show the system permission question if it has not been answered yet (false: only register when already allowed).
 */
export async function registerPush(lang: string, ask = true): Promise<PushState> {
  if (Platform.OS === "web" || !Device.isDevice || !EAS_PROJECT_ID) return "unavailable";
  try {
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("default", { name: "Televet", importance: Notifications.AndroidImportance.HIGH, lightColor: "#0A3FD6" });
    let p = await Notifications.getPermissionsAsync();
    if (p.status !== "granted" && ask && p.canAskAgain) p = await Notifications.requestPermissionsAsync();
    if (p.status !== "granted") return p.canAskAgain ? "off" : "denied";
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })).data;
    await api("/api/app/push-token", { body: { token, app: VARIANT, platform: Platform.OS, language: lang } });
    await AsyncStorage.setItem(KEY, token);
    return "on";
  } catch { return "off"; }
}

/** Sign-out: this phone stops receiving the account's notifications. Must run while still signed in. */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(KEY);
    if (!token) return;
    await api("/api/app/push-token", { method: "DELETE", body: { token } }).catch(() => {});
    await AsyncStorage.removeItem(KEY);
  } catch { /* nothing to undo */ }
}
