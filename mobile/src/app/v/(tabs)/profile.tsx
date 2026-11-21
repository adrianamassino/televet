import { useRouter } from "expo-router";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { ProGate } from "@/components/pro";
import { Header, Screen } from "@/components/Screen";
import { Settings } from "@/components/Settings";
import { Avatar, Card, Pill, PillButton, Txt } from "@/components/ui";
import { siteLang, type CopyKey } from "@/copy";
import { openWeb, sendMail } from "@/lib/actions";
import { API_URL, SUPPORT_EMAIL } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { usePro } from "@/lib/pro";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";

/** The clinic's card, the booking link to share, the door to the full space on the website, settings and sign-out. */
export default function VetProfile() {
  const { t, lang } = useI18n(), { practice, bookings } = usePro(), { session, signOut } = useSession(), router = useRouter();
  if (!practice || !bookings) return <Screen><Header title={t("tabProfile")} /><ProGate /></Screen>;
  const cc = practice.country.toLowerCase(), site = `${API_URL}/${siteLang(lang, practice.country)}/${cc}`;
  const link = `${site}/reserver/${practice.slug}`;
  const status = (`rs_${["pending", "approved", "rejected", "suspended"].includes(practice.review_status) ? practice.review_status : "pending"}`) as CopyKey;
  const paid = practice.stripe_status === "active" || practice.mp_status === "active";
  return (
    <Screen>
      <Header title={t("tabProfile")} />
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <Avatar uri={practice.logo_url} name={practice.name} size={58} />
          <View style={{ flex: 1 }}><Txt v="h3" numberOfLines={2}>{practice.name}</Txt><Txt v="small" numberOfLines={1}>{[practice.city, session?.user.email].filter(Boolean).join(" · ")}</Txt></View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pill tone={practice.review_status === "approved" ? "ok" : practice.review_status === "pending" ? "wait" : "bad"} icon={practice.review_status === "approved" ? "check-circle-outline" : "clock-outline"} label={t(status)} />
          <Pill tone={paid ? "ok" : "wait"} icon="credit-card-outline" label={t(paid ? "paymentsOn" : "paymentsOff")} />
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt v="h3">{t("bookingLink")}</Txt>
        <View style={st.link}><Text style={st.linkTxt} numberOfLines={2} selectable>{link.replace(/^https?:\/\//, "")}</Text></View>
        <PillButton small icon="share-variant-outline" label={t("share")} onPress={() => Share.share({ message: t("shareText", { name: practice.name, url: link }) }).catch(() => {})} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt v="h3">{t("hvTitle")}</Txt>
        <PillButton kind="outline" small icon="map-marker-radius-outline" arrow label={t("hvOpen")} onPress={() => router.push("/v/home-visits")} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt v="body" color={C.soft} style={{ fontSize: 15, lineHeight: 21 }}>{t("manageOnWeb")}</Txt>
        <PillButton kind="outline" small arrow label={t("openDashboard")} onPress={() => openWeb(`${site}/pro/dashboard`)} />
      </Card>

      <Settings />
      <PillButton kind="outline" icon="logout" label={t("signOut")} onPress={signOut} />
      <Pressable accessibilityRole="link" accessibilityLabel={t("deletePro")} onPress={() => sendMail(SUPPORT_EMAIL)} style={({ pressed }) => [{ paddingVertical: 6 }, pressed ? { opacity: 0.6 } : null]}><Txt v="small" center>{t("deletePro")}</Txt></Pressable>
    </Screen>
  );
}

const st = StyleSheet.create({
  link: { backgroundColor: "#F3F8FF", borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 12 },
  linkTxt: { fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: C.blue },
});
