import { Tabs } from "expo-router/js-tabs";
import { tabIcon, useTabBarOptions } from "@/components/tabs";
import { useI18n } from "@/lib/i18n";

export default function OwnerTabs() {
  const { t } = useI18n(), tabBarOptions = useTabBarOptions();
  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen name="index" options={{ title: t("tabHome"), tabBarIcon: tabIcon("home-variant", "home-variant-outline") }} />
      <Tabs.Screen name="appointments" options={{ title: t("tabAppointments"), tabBarIcon: tabIcon("calendar-month", "calendar-month-outline") }} />
      <Tabs.Screen name="pets" options={{ title: t("tabPets"), tabBarIcon: tabIcon("paw", "paw-outline") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabProfile"), tabBarIcon: tabIcon("account-circle", "account-circle-outline") }} />
    </Tabs>
  );
}
