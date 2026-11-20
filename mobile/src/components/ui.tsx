import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { ACCENT_ON_DEEP, ACCENT_ON_LIGHT, C, F, G, R, T, shadow } from "@/lib/theme";
import { initials } from "@/lib/format";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
export const Icon = MaterialCommunityIcons;

// ------------------------------------------------------------------ text
type Variant = keyof typeof T;
export function Txt({ v = "body", color, center, style, ...rest }: TextProps & { v?: Variant; color?: string; center?: boolean }) {
  return <Text {...rest} style={[T[v], color ? { color } : null, center ? { textAlign: "center" } : null, style]} />;
}

function mix(stops: readonly string[], t: number): string {
  const n = stops.length - 1, x = Math.min(n, Math.max(0, t * n)), i = Math.min(n - 1, Math.floor(x)), f = x - i;
  const a = stops[i], b = stops[i + 1];
  const ch = (s: string, k: number) => parseInt(s.slice(1 + k * 2, 3 + k * 2), 16);
  return `rgb(${[0, 1, 2].map((k) => Math.round(ch(a, k) + (ch(b, k) - ch(a, k)) * f)).join(",")})`;
}

/**
 * Two-part headline of the Televet design: the first part in the plain colour, the second one tinted
 * from blue to turquoise letter by letter ("Expert care for your pet, wherever you are").
 */
export function Headline({ a, b, deep, size = "h1", stack, style }: { a: string; b: string; deep?: boolean; size?: "h1" | "h2"; stack?: boolean; style?: StyleProp<TextStyle> }) {
  const stops = deep ? ACCENT_ON_DEEP : ACCENT_ON_LIGHT, letters = [...b];
  return (
    <Text accessibilityRole="header" style={[T[size], deep ? { color: C.white } : null, style]}>
      {a}{stack ? "\n" : " "}
      <Text accessible={false}>{letters.map((ch, i) => <Text key={i} style={{ color: mix(stops, letters.length > 1 ? i / (letters.length - 1) : 0) }}>{ch}</Text>)}</Text>
    </Text>
  );
}

/** Small tracked label with a short line, used above section titles. */
export function Eyebrow({ children, deep }: { children: string; deep?: boolean }) {
  return (
    <View style={st.eyebrow}>
      <Text style={[T.eyebrow, deep ? { color: "#BFE9FF" } : null]}>{children}</Text>
      <View style={[st.eyebrowLine, deep ? { backgroundColor: "#BFE9FF" } : null]} />
    </View>
  );
}

// ------------------------------------------------------------------ buttons
type BtnKind = "primary" | "white" | "outline" | "ghost" | "quiet" | "danger" | "quietDanger";
export function PillButton({ label, onPress, kind = "primary", arrow, icon, loading, disabled, small, style, accessibilityLabel }: {
  label: string; onPress?: () => void; kind?: BtnKind; arrow?: boolean; icon?: IconName; loading?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const off = disabled || loading;
  const fg = kind === "primary" || kind === "ghost" ? C.white : kind === "danger" || kind === "quietDanger" ? C.danger : kind === "white" ? C.navy : C.blue;
  const inner = (
    <View style={[st.btnRow, small ? { minHeight: 42, paddingHorizontal: 18 } : null]}>
      {loading ? <ActivityIndicator color={fg} /> : <>
        {icon && <Icon name={icon} size={small ? 18 : 20} color={fg} />}
        <Text numberOfLines={1} style={[T.button, small ? { fontSize: 14.5 } : null, { color: fg, flexShrink: 1 }]}>{label}</Text>
        {arrow && <Icon name="arrow-right" size={small ? 18 : 20} color={fg} />}
      </>}
    </View>
  );
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: !!off, busy: !!loading }} disabled={off} onPress={onPress}
      style={({ pressed }) => [st.btn, kind === "primary" ? shadow("lift") : null, kind === "white" ? [st.btnWhite, shadow("soft")] : null, kind === "outline" ? st.btnOutline : null, kind === "ghost" ? st.btnGhost : null, kind === "danger" ? st.btnDanger : null,
        off ? { opacity: 0.5 } : null, pressed ? { opacity: 0.86, transform: [{ scale: 0.985 }] } : null, style]}>
      {kind === "primary" ? <LinearGradient colors={G.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnFill}>{inner}</LinearGradient> : inner}
    </Pressable>
  );
}

/** Round icon button (back arrows, "open" arrows on cards, delete…). */
export function IconButton({ name, onPress, label, tone = "blue", size = 40 }: { name: IconName; onPress?: () => void; label: string; tone?: "blue" | "white" | "danger" | "plain"; size?: number }) {
  const bg = tone === "blue" ? C.tint : tone === "white" ? "rgba(255,255,255,0.2)" : tone === "danger" ? C.dangerBg : "transparent";
  const fg = tone === "white" ? C.white : tone === "danger" ? C.danger : C.blue;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }, pressed ? { opacity: 0.7 } : null]}>
      <Icon name={name} size={size * 0.52} color={fg} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ surfaces
export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }) {
  if (!onPress) return <View style={[st.card, shadow(), style]}>{children}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [st.card, shadow(), style, pressed ? { opacity: 0.9, transform: [{ scale: 0.992 }] } : null]}>{children}</Pressable>;
}
/** Frosted white panel (the "glass" strip of the design). */
export function Glass({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[st.glass, shadow(), style]}>{children}</View>;
}
export const Divider = ({ vertical }: { vertical?: boolean }) => <View style={vertical ? { width: StyleSheet.hairlineWidth * 2, alignSelf: "stretch", backgroundColor: "#C9DBF7", marginVertical: 6 } : { height: StyleSheet.hairlineWidth * 2, backgroundColor: C.line, marginVertical: 12 }} />;

/** Rounded square with an icon, tinted pale blue (service types, list rows). */
export function IconTile({ name, size = 44, tone = "blue" }: { name: IconName; size?: number; tone?: "blue" | "teal" | "deep" }) {
  const bg = tone === "teal" ? "#DDF8F4" : tone === "deep" ? C.blue : C.tint, fg = tone === "teal" ? "#0E8F89" : tone === "deep" ? C.white : C.blue;
  return <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}><Icon name={name} size={size * 0.54} color={fg} /></View>;
}

export function Avatar({ uri, name, size = 52 }: { uri?: string | null; name: string; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.tint }} contentFit="cover" accessibilityIgnoresInvertColors />;
  return (
    <LinearGradient colors={["#0A3FD6", "#1E7BFF", "#22B8EA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: F.bold, fontSize: size * 0.36, color: C.white }}>{initials(name)}</Text>
    </LinearGradient>
  );
}

// ------------------------------------------------------------------ small pieces
type Tone = "ok" | "wait" | "bad" | "info" | "mute";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: C.okBg, fg: C.ok }, wait: { bg: C.warnBg, fg: C.warn }, bad: { bg: C.dangerBg, fg: C.danger }, info: { bg: C.tint, fg: C.blue }, mute: { bg: "#EEF1F8", fg: C.soft },
};
export function Pill({ label, tone = "info", icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const c = TONES[tone];
  return <View style={[st.pill, { backgroundColor: c.bg }]}>{icon && <Icon name={icon} size={13} color={c.fg} />}<Text style={[st.pillTxt, { color: c.fg }]} numberOfLines={1}>{label}</Text></View>;
}
export const statusTone = (s: string): Tone => (s === "confirmed" ? "ok" : s === "pending" ? "wait" : s === "declined" ? "bad" : "mute");

/** Message box: information, success, or a problem to fix. Announced by screen readers when it appears. */
export function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "ok" | "bad" }) {
  if (!text) return null;
  const c = tone === "ok" ? TONES.ok : tone === "bad" ? TONES.bad : TONES.info;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[st.notice, { backgroundColor: c.bg }]}>
      <Icon name={tone === "ok" ? "check-circle-outline" : tone === "bad" ? "alert-circle-outline" : "information-outline"} size={20} color={c.fg} />
      <Text style={[T.small, { color: c.fg, flex: 1, fontSize: 14.5, lineHeight: 20 }]}>{text}</Text>
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: IconName; title?: string; text: string; action?: ReactNode }) {
  return (
    <View style={st.empty}>
      <View style={st.emptyIco}><Icon name={icon} size={30} color={C.blue} /></View>
      {title && <Txt v="h3" center>{title}</Txt>}
      <Txt v="body" color={C.soft} center style={{ maxWidth: 320 }}>{text}</Txt>
      {action}
    </View>
  );
}
export const Loading = () => <View style={{ paddingVertical: 36, alignItems: "center" }}><ActivityIndicator color={C.blue} size="large" /></View>;

// ------------------------------------------------------------------ inputs
export function Field({ label, hint, error, style, onFocus, onBlur, ...rest }: TextInputProps & { label?: string; hint?: string; error?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={[T.small, { color: C.ink }]}>{label}</Text>}
      <TextInput accessibilityLabel={label ?? rest.placeholder} placeholderTextColor={C.mute} {...rest}
        onFocus={(e) => { setFocus(true); onFocus?.(e); }} onBlur={(e) => { setFocus(false); onBlur?.(e); }}
        style={[st.input, rest.multiline ? { minHeight: 96, paddingTop: 14, textAlignVertical: "top" } : null, focus ? { borderColor: C.azure } : null, error ? { borderColor: C.danger } : null, style]} />
      {(error || hint) && <Text style={[T.tiny, error ? { color: C.danger } : null]}>{error || hint}</Text>}
    </View>
  );
}

/** Row of choices where exactly one is selected (service type, language, pet…). */
export function Choice<V extends string>({ options, value, onChange, wrap }: { options: { value: V; label: string; icon?: IconName }[]; value: V; onChange: (v: V) => void; wrap?: boolean }) {
  return (
    <View accessibilityRole="radiogroup" style={[{ flexDirection: "row", gap: 8 }, wrap ? { flexWrap: "wrap" } : null]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={o.label} onPress={() => onChange(o.value)} style={({ pressed }) => [st.choice, on ? st.choiceOn : null, pressed ? { opacity: 0.8 } : null]}>
            {o.icon && <Icon name={o.icon} size={17} color={on ? C.white : C.blue} />}
            <Text style={[st.choiceTxt, on ? { color: C.white } : null]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Label / value line used in detail cards. */
export function Row({ icon, label, value, onPress }: { icon: IconName; label?: string; value: string; onPress?: () => void }) {
  const body = (
    <View style={st.row}>
      <IconTile name={icon} size={38} />
      <View style={{ flex: 1 }}>{label ? <Text style={T.tiny}>{label}</Text> : null}<Text style={[T.strong, onPress ? { color: C.blue } : null]}>{value}</Text></View>
      {onPress && <Icon name="chevron-right" size={22} color={C.mute} />}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={label ? `${label}: ${value}` : value} onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}>{body}</Pressable> : body;
}

const st = StyleSheet.create({
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  eyebrowLine: { width: 34, height: 2, borderRadius: 1, backgroundColor: C.azure },
  btn: { borderRadius: R.pill, alignSelf: "stretch", overflow: "visible" },
  btnFill: { borderRadius: R.pill },
  btnRow: { minHeight: 52, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnWhite: { backgroundColor: C.white },
  btnOutline: { backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1.5, borderColor: "#B9CFFA" },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)" },
  btnDanger: { backgroundColor: C.white, borderWidth: 1.5, borderColor: "#F1C4C0" },
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: "#E4EDFC", padding: 16 },
  glass: { backgroundColor: C.glass, borderRadius: 26, borderWidth: 1, borderColor: C.glassLine },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, alignSelf: "flex-start" },
  pillTxt: { fontFamily: F.semi, fontSize: 12.5, lineHeight: 17 },
  notice: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: R.md },
  empty: { alignItems: "center", gap: 10, paddingVertical: 28, paddingHorizontal: 12 },
  emptyIco: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.tint, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white, paddingHorizontal: 16, fontFamily: F.regular, fontSize: 16, color: C.ink },
  choice: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 42, paddingHorizontal: 14, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1.5, borderColor: "#C9DBF7" },
  choiceOn: { backgroundColor: C.blue, borderColor: C.blue },
  choiceTxt: { fontFamily: F.semi, fontSize: 14.5, color: C.blue },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});

/** Date typed as digits; the slashes appear by themselves (25122025 → 25/12/2025). */
export function DateField({ label, value, onChange, placeholder, error }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; error?: string }) {
  return <Field label={label} value={value} placeholder={placeholder} error={error} keyboardType="number-pad" maxLength={10}
    onChangeText={(x) => { const d = x.replace(/\D/g, "").slice(0, 8); onChange(d.length <= 2 ? d : d.length <= 4 ? `${d.slice(0, 2)}/${d.slice(2)}` : `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`); }} />;
}
