import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * One codebase, two store apps:
 *   APP_VARIANT=owner (default) → "Televet"      for pet owners
 *   APP_VARIANT=vet             → "Televet Pro"  for veterinarians
 * The variant is read at build time (see eas.json) and exposed to the code as `extra.variant`.
 */
const variant = process.env.APP_VARIANT === "vet" ? "vet" : "owner";
const isVet = variant === "vet";

/** Expo (EAS) project of each app. Filled in once, after `eas init` has been run for each variant. */
const EAS_PROJECT_IDS = { owner: "", vet: "" };

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isVet ? "Televet Pro" : "Televet",
  slug: isVet ? "televet-pro" : "televet",
  scheme: isVet ? "televetpro" : "televet",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: `./assets/${variant}/icon.png`,
  ios: {
    bundleIdentifier: isVet ? "co.televet.pro" : "co.televet.app",
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: isVet ? "co.televet.pro" : "co.televet.app",
    adaptiveIcon: {
      foregroundImage: `./assets/${variant}/adaptive-foreground.png`,
      backgroundImage: `./assets/${variant}/adaptive-background.png`,
      monochromeImage: "./assets/brand/adaptive-monochrome.png",
      backgroundColor: isVet ? "#0A2A9C" : "#0A3FD6",
    },
  },
  web: { bundler: "metro", output: "single", favicon: "./assets/brand/favicon.png" },
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-web-browser",
    ["expo-splash-screen", { image: "./assets/brand/splash.png", imageWidth: 150, resizeMode: "contain", backgroundColor: isVet ? "#0A2A9C" : "#0A3FD6" }],
    ["expo-notifications", { icon: "./assets/brand/notification.png", color: "#0A3FD6", defaultChannel: "default" }],
    ...(isVet ? [] : ([["expo-image-picker", {
      photosPermission: "Televet uses your photos so you can add pages of your pet's health booklet.",
      cameraPermission: "Televet uses the camera so you can photograph your pet's health booklet.",
      microphonePermission: false,
    }]] as [string, Record<string, unknown>][])),
  ],
  experiments: { typedRoutes: false },
  extra: {
    variant,
    // Site that serves the Televet API. Everything else (database address, public keys) is read from it at start-up.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://televet.netlify.app",
    eas: { projectId: process.env.EAS_PROJECT_ID || EAS_PROJECT_IDS[variant] || undefined },
  },
});
