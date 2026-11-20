import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, useFonts } from "@expo-google-fonts/manrope";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { DeepPanel } from "@/components/Backdrop";
import { Logo } from "@/components/Screen";
import { PillButton, Txt } from "@/components/ui";
import { boot } from "@/lib/boot";
import { IS_VET } from "@/lib/config";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { C } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Opens the right screen when a notification is tapped (also when the tap is what launched the app). */
function NotificationRouter() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === "web") return;
    const open = (data: unknown) => {
      const d = (data ?? {}) as { kind?: string; bookingId?: string };
      if (IS_VET) { if (d.bookingId) router.push({ pathname: "/v/booking/[id]", params: { id: d.bookingId } }); else router.push("/v"); }
      else router.push(d.kind === "owner_pet_due" ? "/o/pets" : "/o/appointments");
    };
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) { open(r.notification.request.content.data); Notifications.clearLastNotificationResponseAsync().catch(() => {}); } }).catch(() => {});
    return () => sub.remove();
  }, [router]);
  return null;
}

function BootError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <DeepPanel flat radius={0} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 18 }}>
        <Logo tone="white" width={170} />
        <Txt v="body" color={C.white} center>{t("bootErr")}</Txt>
        <PillButton kind="white" label={t("retry")} onPress={onRetry} style={{ alignSelf: "center", minWidth: 200 }} />
      </View>
    </DeepPanel>
  );
}

export default function RootLayout() {
  const [fonts, fontError] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const start = useCallback(() => { setState("loading"); boot().then(() => setState("ready")).catch(() => setState("error")); }, []);
  useEffect(() => { start(); }, [start]);
  const fontsDone = fonts || !!fontError; // if the font cannot load the system font is used: never block the app for it
  useEffect(() => { if (fontsDone && state !== "loading") SplashScreen.hideAsync().catch(() => {}); }, [fontsDone, state]);

  if (!fontsDone || state === "loading") return null; // the splash screen stays up
  if (state === "error") return <I18nProvider><StatusBar style="light" /><BootError onRetry={start} /></I18nProvider>;
  return (
    <I18nProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
        <NotificationRouter />
      </SessionProvider>
    </I18nProvider>
  );
}
