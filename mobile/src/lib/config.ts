import Constants from "expo-constants";

type Extra = { variant?: string; apiUrl?: string; eas?: { projectId?: string } };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** Which of the two apps this build is: "owner" (Televet) or "vet" (Televet Pro). Decided at build time (see app.config.ts). */
export const VARIANT: "owner" | "vet" = (process.env.EXPO_PUBLIC_APP_VARIANT ?? extra.variant) === "vet" ? "vet" : "owner";
export const IS_VET = VARIANT === "vet";
/** Address of the Televet website; it serves the API and the pages the apps open (payment, password reset, legal). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? "https://televet.netlify.app").replace(/\/+$/, "");
export const SCHEME = IS_VET ? "televetpro" : "televet";
export const EAS_PROJECT_ID: string | undefined = extra.eas?.projectId ?? Constants.easConfig?.projectId;
export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
export const SUPPORT_EMAIL = "contact@televet.co";
