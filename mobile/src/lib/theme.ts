import { Platform, type TextStyle, type ViewStyle } from "react-native";

/** Televet look: deep blue → azure → turquoise, white glass cards, pill buttons. */
export const C = {
  navy: "#0B1F5C",       // headings
  ink: "#16275F",        // strong body text
  soft: "#4A5A8A",       // secondary text
  mute: "#7886AB",       // hints
  blue: "#0A3FD6",       // brand blue (logo)
  blueDeep: "#0A2A9C",
  night: "#06123F",
  azure: "#1E7BFF",
  cyan: "#22B8EA",
  teal: "#22C7C0",
  aqua: "#3FD9C9",
  bg: "#F2F7FF",
  card: "#FFFFFF",
  line: "#DCE8FB",
  glass: "rgba(255,255,255,0.82)",
  glassLine: "rgba(255,255,255,0.9)",
  tint: "#E8F1FF",       // pale blue fills
  ok: "#0B6B4D", okBg: "#D9F7EE",
  warn: "#7A4A00", warnBg: "#FFF0C9",
  danger: "#B3261E", dangerBg: "#FDE7E5",
  white: "#FFFFFF",
} as const;

/** Gradients (expo-linear-gradient colour stops). */
export const G = {
  brand: ["#0A2A9C", "#0A3FD6", "#1E7BFF", "#22B8EA", "#3FD9C9"] as const,
  brandStops: [0, 0.3, 0.6, 0.84, 1] as const,
  pro: ["#06123F", "#0A2A9C", "#0A3FD6", "#1E7BFF"] as const,
  proStops: [0, 0.42, 0.76, 1] as const,
  button: ["#0A2A9C", "#0A3FD6", "#1E6BFF"] as const,
  light: ["#FFFFFF", "#EEF6FF", "#DDEFFF"] as const,
};
/** Colours used to tint a headline's accent words from blue to turquoise, letter by letter. */
export const ACCENT_ON_LIGHT = ["#0A3FD6", "#1E7BFF", "#22B8EA", "#1FC3BC"] as const;
export const ACCENT_ON_DEEP = ["#7FE9FF", "#5FF0E0", "#8CF5D8"] as const;

export const F = { regular: "Manrope_400Regular", medium: "Manrope_500Medium", semi: "Manrope_600SemiBold", bold: "Manrope_700Bold" } as const;

export const T: Record<"h1" | "h2" | "h3" | "body" | "strong" | "small" | "tiny" | "eyebrow" | "button", TextStyle> = {
  h1: { fontFamily: F.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, color: C.navy },
  h2: { fontFamily: F.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: C.navy },
  h3: { fontFamily: F.semi, fontSize: 17, lineHeight: 23, color: C.navy },
  body: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.ink },
  strong: { fontFamily: F.semi, fontSize: 16, lineHeight: 23, color: C.ink },
  small: { fontFamily: F.medium, fontSize: 13.5, lineHeight: 19, color: C.soft },
  tiny: { fontFamily: F.medium, fontSize: 12, lineHeight: 16, color: C.mute },
  eyebrow: { fontFamily: F.bold, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, color: C.blue, textTransform: "uppercase" },
  button: { fontFamily: F.semi, fontSize: 16, lineHeight: 21 },
};

export const R = { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 } as const;
export const S = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 } as const;

/** Soft blue shadow under white cards. */
export const shadow = (strength: "soft" | "lift" = "soft"): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation: strength === "lift" ? 8 : 3, shadowColor: "#1E5BFF" },
    default: { shadowColor: "#1E5BFF", shadowOpacity: strength === "lift" ? 0.28 : 0.14, shadowRadius: strength === "lift" ? 22 : 16, shadowOffset: { width: 0, height: strength === "lift" ? 14 : 10 } },
  }) as ViewStyle;
