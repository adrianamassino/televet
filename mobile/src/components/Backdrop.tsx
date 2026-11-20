import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, Ellipse, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { C, G, shadow } from "@/lib/theme";
import { IS_VET } from "@/lib/config";

/** Light page background of the Televet design: white fading to pale blue, with turquoise and azure glows and a soft wave. */
export function Backdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <LinearGradient colors={G.light} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bdA" cx="0.94" cy="0.03" rx="0.75" ry="0.36" fx="0.94" fy="0.03"><Stop offset="0" stopColor="#3FD9C9" stopOpacity="0.36" /><Stop offset="1" stopColor="#3FD9C9" stopOpacity="0" /></RadialGradient>
          <RadialGradient id="bdB" cx="0" cy="0.36" rx="0.8" ry="0.34" fx="0" fy="0.36"><Stop offset="0" stopColor="#1E7BFF" stopOpacity="0.16" /><Stop offset="1" stopColor="#1E7BFF" stopOpacity="0" /></RadialGradient>
          <RadialGradient id="bdC" cx="1" cy="0.98" rx="0.9" ry="0.34" fx="1" fy="0.98"><Stop offset="0" stopColor="#22B8EA" stopOpacity="0.26" /><Stop offset="1" stopColor="#22B8EA" stopOpacity="0" /></RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="800" fill="url(#bdA)" />
        <Rect x="0" y="0" width="400" height="800" fill="url(#bdB)" />
        <Rect x="0" y="0" width="400" height="800" fill="url(#bdC)" />
        <Path d="M0 610 C 90 566 170 640 262 604 S 372 548 400 566 L400 800 L0 800 Z" fill="#FFFFFF" fillOpacity="0.42" />
        <Path d="M0 690 C 110 650 210 730 310 690 S 380 660 400 668 L400 800 L0 800 Z" fill="#FFFFFF" fillOpacity="0.38" />
      </Svg>
    </View>
  );
}

/** The curves and glows drawn over a deep blue panel. */
function DeepArt({ ecg }: { ecg?: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <Defs>
        <RadialGradient id="dpA" cx="0.98" cy="0" rx="0.8" ry="0.9" fx="0.98" fy="0"><Stop offset="0" stopColor="#5FF0E0" stopOpacity="0.5" /><Stop offset="1" stopColor="#5FF0E0" stopOpacity="0" /></RadialGradient>
        <RadialGradient id="dpB" cx="0" cy="1" rx="0.7" ry="0.8" fx="0" fy="1"><Stop offset="0" stopColor="#3C2BE0" stopOpacity="0.35" /><Stop offset="1" stopColor="#3C2BE0" stopOpacity="0" /></RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="300" fill="url(#dpA)" />
      <Rect x="0" y="0" width="400" height="300" fill="url(#dpB)" />
      <Path d="M150 0 C 210 70 300 60 400 150 L400 0 Z" fill="#FFFFFF" fillOpacity="0.07" />
      <Path d="M0 214 C 80 176 150 250 240 216 S 360 150 400 176 L400 300 L0 300 Z" fill="#FFFFFF" fillOpacity="0.08" />
      <Path d="M0 250 C 100 220 190 280 290 248 S 370 214 400 226 L400 300 L0 300 Z" fill="#FFFFFF" fillOpacity="0.08" />
      <Ellipse cx="330" cy="40" rx="150" ry="110" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="1" />
      {ecg && <>
        <Path d="M214 96 H262 L270 80 L280 124 L292 58 L304 110 L312 96 H400" fill="none" stroke="#8FF3FF" strokeOpacity="0.22" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        <Path d="M214 96 H262 L270 80 L280 124 L292 58 L304 110 L312 96 H400" fill="none" stroke="#CFFBFF" strokeOpacity="0.9" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </>}
    </Svg>
  );
}

/** Deep blue → turquoise panel with waves: hero cards, call-to-action bands, the sign-in background. The vets' app uses a darker navy. */
export function DeepPanel({ children, style, radius = 30, ecg, flat }: { children?: ReactNode; style?: StyleProp<ViewStyle>; radius?: number; ecg?: boolean; flat?: boolean }) {
  return (
    <View style={[{ borderRadius: radius, backgroundColor: C.blue }, flat ? null : shadow("lift"), style]}>
      <View style={{ borderRadius: radius, overflow: "hidden", flexGrow: 1 }}>
        <LinearGradient colors={IS_VET ? G.pro : G.brand} locations={IS_VET ? G.proStops : G.brandStops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <DeepArt ecg={ecg} />
        {children}
      </View>
    </View>
  );
}
