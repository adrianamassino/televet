import { Platform, type ColorValue, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./ui";
import { C, F } from "@/lib/theme";

/** Shared look of the bottom tab bar in both apps: white, rounded top, blue for the current tab. */
export function useTabBarOptions() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: C.blue,
    tabBarInactiveTintColor: C.mute,
    tabBarHideOnKeyboard: true,
    tabBarLabelStyle: { fontFamily: F.semi, fontSize: 11.5, marginTop: 2 } satisfies TextStyle,
    tabBarItemStyle: { paddingTop: 8 } satisfies ViewStyle,
    tabBarStyle: {
      height: 64 + insets.bottom, backgroundColor: C.white, borderTopWidth: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      ...(Platform.OS === "android" ? { elevation: 16 } : { shadowColor: "#1E5BFF", shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: -6 } }),
    } satisfies ViewStyle,
    sceneStyle: { backgroundColor: C.bg } satisfies ViewStyle,
  } as const;
}

/** Tab icon: filled when the tab is the current one, outlined otherwise. */
export const tabIcon = (on: IconName, off: IconName) => function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return <Icon name={focused ? on : off} size={25} color={typeof color === "string" ? color : C.blue} />;
};
