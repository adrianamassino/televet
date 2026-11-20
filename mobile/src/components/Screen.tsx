import { Image } from "expo-image";
import { type ComponentRef, type ReactNode, type RefObject } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Backdrop } from "./Backdrop";
import { Txt } from "./ui";
import { C } from "@/lib/theme";

export type ScrollRef = ComponentRef<typeof ScrollView>;

/** Page shell: Televet background, safe areas, scrolling, pull-to-refresh, keyboard handling. Content is centred on tablets. */
export function Screen({ children, onRefresh, refreshing, top = true, footer, contentStyle, scroll = true, scrollRef }: {
  children: ReactNode; onRefresh?: () => void; refreshing?: boolean; top?: boolean; footer?: ReactNode; contentStyle?: StyleProp<ViewStyle>; scroll?: boolean; scrollRef?: RefObject<ScrollRef | null>;
}) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = { paddingTop: (top ? insets.top : 0) + 14, paddingHorizontal: 20, paddingBottom: 40, gap: 16, width: "100%", maxWidth: 600, alignSelf: "center" };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[pad, contentStyle]}
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.blue} colors={[C.blue]} /> : undefined}>
            {children}
          </ScrollView>
        ) : <View style={[pad, { flex: 1 }, contentStyle]}>{children}</View>}
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

const LOGOS = { blue: require("../../assets/brand/logo-blue.png"), white: require("../../assets/brand/logo-white.png") };
/** Televet wordmark (heart-paw + name). The image is 1080 × 251. */
export function Logo({ tone = "blue", width = 132 }: { tone?: "blue" | "white"; width?: number }) {
  return <Image source={LOGOS[tone]} style={{ width, height: Math.round((width * 251) / 1080) }} contentFit="contain" accessibilityLabel="Televet" accessibilityRole="image" />;
}

/** Large page title of a tab, with an optional control on the right. */
export function Header({ title, right }: { title: string; right?: ReactNode }) {
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: 12 }}><Txt v="h1" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Txt>{right}</View>;
}
