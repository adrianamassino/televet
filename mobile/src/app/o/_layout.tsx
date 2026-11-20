import { Redirect, Stack } from "expo-router";
import { IS_VET } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { C, F } from "@/lib/theme";

/** Everything of the owners' app ("Televet"). */
export default function OwnerLayout() {
  const { t } = useI18n();
  if (IS_VET) return <Redirect href="/" />;
  return (
    <Stack screenOptions={{
      headerShown: false, headerShadowVisible: false, headerTintColor: C.blue, headerBackButtonDisplayMode: "minimal",
      headerStyle: { backgroundColor: "#F8FBFF" }, headerTitleStyle: { fontFamily: F.semi, fontSize: 17, color: C.navy }, contentStyle: { backgroundColor: C.bg },
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="practice/[id]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="book" options={{ headerShown: true, title: t("bookingTitle") }} />
      <Stack.Screen name="pet/[id]" options={{ headerShown: true, title: t("healthRecord") }} />
    </Stack>
  );
}
