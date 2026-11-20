import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text, View } from "react-native";
import { Card, Empty, Icon, IconTile, Loading, Notice, Pill, PillButton, Txt, statusTone } from "./ui";
import { siteLang, type CopyKey } from "@/copy";
import { SPECIES_ICON, TYPE_ICON, typeKey } from "@/lib/actions";
import { API_URL } from "@/lib/config";
import { hour } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { usePro } from "@/lib/pro";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";
import type { ProBooking } from "@/lib/types";

export const clientLine = (b: ProBooking) => [b.owners?.full_name, b.pets?.name].filter(Boolean).join(" — ") || "—";
export const serviceName = (b: ProBooking, t: (k: CopyKey) => string) => b.services?.custom_name || t(typeKey(b.type));

/** One appointment in a list of the vets' app: time, type, client and pet. */
export function BookingRow({ b, tz, onPress, showStatus }: { b: ProBooking; tz: string; onPress: () => void; showStatus?: boolean }) {
  const { t, lang } = useI18n();
  return (
    <Card onPress={onPress} accessibilityLabel={`${hour(b.starts_at, lang, tz)}, ${clientLine(b)}`} style={st.row}>
      <View style={st.time}><Text style={st.timeTxt}>{hour(b.starts_at, lang, tz)}</Text><Text style={st.timeEnd}>{hour(b.ends_at, lang, tz)}</Text></View>
      <IconTile name={TYPE_ICON[b.type] ?? "stethoscope"} size={40} tone={b.type === "video" ? "teal" : "blue"} />
      <View style={{ flex: 1, gap: 1 }}>
        <Txt v="strong" numberOfLines={1}>{b.owners?.full_name || "—"}</Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          {b.pets && <Icon name={SPECIES_ICON[b.pets.species] ?? "paw"} size={15} color={C.soft} />}
          <Txt v="small" numberOfLines={1} style={{ flex: 1 }}>{[b.pets?.name, serviceName(b, t)].filter(Boolean).join(" · ")}</Txt>
        </View>
        {showStatus && <Pill tone={statusTone(b.status)} label={t((`s_${b.status}`) as CopyKey)} />}
      </View>
      <Icon name="chevron-right" size={22} color={C.mute} />
    </Card>
  );
}

/**
 * What a vets' screen shows instead of its content while the clinic is loading, could not be loaded,
 * or does not exist yet (account created but sign-up not finished on the website). Returns null when everything is ready.
 */
export function ProGate() {
  const { t, lang, country } = useI18n(), { practice, bookings, error, reload } = usePro(), { signOut } = useSession();
  if (practice === undefined || bookings === null) {
    return error ? <View style={{ gap: 14 }}><Notice tone="bad" text={error} /><PillButton kind="outline" label={t("retry")} onPress={reload} /></View> : <Loading />;
  }
  if (practice === null) {
    return (
      <Empty icon="hospital-building" title={t("noPracticeT")} text={t("noPracticeP")} action={
        <View style={{ gap: 10, alignSelf: "stretch", marginTop: 6 }}>
          <PillButton arrow label={t("openSite")} onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/${siteLang(lang, country)}/${country.toLowerCase()}/pro/inscription`).catch(() => {})} />
          <PillButton kind="outline" label={t("retry")} onPress={reload} />
          <PillButton kind="quiet" small label={t("signOut")} onPress={signOut} />
        </View>} />
    );
  }
  return null;
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  time: { width: 50, alignItems: "flex-start" },
  timeTxt: { fontFamily: F.bold, fontSize: 16, color: C.navy },
  timeEnd: { fontFamily: F.medium, fontSize: 12, color: C.mute },
});
