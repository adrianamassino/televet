import { type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PillButton, Txt } from "./ui";
import { C, shadow } from "@/lib/theme";

/** Bottom sheet that asks to confirm an action (works the same on iOS, Android and the web preview). */
export function Confirm({ visible, title, text, confirmLabel, cancelLabel, danger, busy, onConfirm, onCancel, children }: {
  visible: boolean; title: string; text?: string; confirmLabel: string; cancelLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void; children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView style={st.wrap} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={cancelLabel} onPress={onCancel} />
        <View accessibilityViewIsModal style={[st.sheet, shadow("lift"), { paddingBottom: insets.bottom + 20 }]}>
          <View style={st.grip} />
          <Txt v="h2">{title}</Txt>
          {text && <Txt v="body" color={C.soft}>{text}</Txt>}
          {children}
          <PillButton kind={danger ? "danger" : "primary"} label={confirmLabel} loading={busy} onPress={onConfirm} />
          <PillButton kind="quiet" label={cancelLabel} onPress={onCancel} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(6,18,63,0.45)" },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, gap: 12, width: "100%", maxWidth: 600, alignSelf: "center" },
  grip: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#D5E0F5", marginBottom: 6 },
});
