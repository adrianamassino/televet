import { Tabs } from "expo-router/js-tabs";
import { tabIcon, useTabBarOptions } from "@/components/tabs";
import { useI18n } from "@/lib/i18n";
import { isRequest, usePro } from "@/lib/pro";
import { C } from "@/lib/theme";

export default function VetTabs() {
  const { t } = useI18n(), tabBarOptions = useTabBarOptions(), { bookings } = usePro();
  const waiting = (bookings ?? []).filter(isRequest).length;
  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen name="index" options={{ title: t("tabAgenda"), tabBarIcon: tabIcon("calendar-month", "calendar-month-outline") }} />
      <Tabs.Screen name="requests" options={{ title: t("tabRequests"), tabBarIcon: tabIcon("bell-ring", "bell-ring-outline"), tabBarBadge: waiting || undefined, tabBarBadgeStyle: { backgroundColor: C.teal, color: C.night } }} />
      <Tabs.Screen name="clients" options={{ title: t("tabClients"), tabBarIcon: tabIcon("account-group", "account-group-outline") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabProfile"), tabBarIcon: tabIcon("account-circle", "account-circle-outline") }} />
    </Tabs>
  );
}
