import { Redirect, Stack } from "expo-router";
import { IS_VET } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { ProProvider } from "@/lib/pro";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";

/** Everything of the vets' app ("Televet Pro"): always behind a sign-in. */
export default function VetLayout() {
  const { t } = useI18n(), { ready, session } = useSession();
  if (!IS_VET) return <Redirect href="/" />;
  if (!ready) return null;
  if (!session) return <Redirect href="/login" />;
  return (
    <ProProvider>
      <Stack screenOptions={{
        headerShown: false, headerShadowVisible: false, headerTintColor: C.blue, headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: "#F8FBFF" }, headerTitleStyle: { fontFamily: F.semi, fontSize: 17, color: C.navy }, contentStyle: { backgroundColor: C.bg },
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: t("appointment") }} />
      </Stack>
    </ProProvider>
  );
}
