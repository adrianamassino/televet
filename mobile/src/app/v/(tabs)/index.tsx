import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DeepPanel } from "@/components/Backdrop";
import { BookingRow, ProGate, clientLine, serviceName } from "@/components/pro";
import { Logo, Screen } from "@/components/Screen";
import { Avatar, Card, Divider, Empty, Eyebrow, Glass, Icon, Notice, Pill, PillButton, Txt } from "@/components/ui";
import { TYPE_ICON, openVideo, typeKey } from "@/lib/actions";
import { addDays, dayKey, dayLabel, hour, longDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { isRequest, usePro } from "@/lib/pro";
import { pushState, registerPush, type PushState } from "@/lib/push";
import { C, F } from "@/lib/theme";
import type { ProBooking } from "@/lib/types";

/** Home of the vets' app: today's numbers, the next appointment (with the video button) and the coming days. */
export default function Agenda() {
  const { t, lang } = useI18n(), router = useRouter(), { practice, bookings, error, reload } = usePro();
  const [refreshing, setRefreshing] = useState(false), [push, setPush] = useState<PushState>("unavailable");
  const [opening, setOpening] = useState(false), [note, setNote] = useState("");
  useFocusEffect(useCallback(() => { reload(); pushState().then(setPush); }, [reload]));

  if (!practice || !bookings) return <Screen><View style={st.top}><ProLogo /></View><ProGate /></Screen>;

  const tz = practice.timezone, now = Date.now();
  const confirmed = bookings.filter((b) => b.status === "confirmed" && Date.parse(b.ends_at) > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const waiting = bookings.filter(isRequest).length;
  const todayKey = dayKey(new Date(), tz), tomorrowKey = addDays(todayKey, 1);
  const next: ProBooking | undefined = confirmed[0];
  const groups = new Map<string, ProBooking[]>();
  for (const b of confirmed.slice(next ? 1 : 0)) { const k = dayKey(b.starts_at, tz); groups.set(k, [...(groups.get(k) ?? []), b]); }
  const open = (b: ProBooking) => router.push({ pathname: "/v/booking/[id]", params: { id: b.id } });
  const stats: [number, string][] = [
    [confirmed.filter((b) => dayKey(b.starts_at, tz) === todayKey).length, t("statToday")],
    [waiting, t("statPending")],
    [confirmed.filter((b) => Date.parse(b.starts_at) < now + 7 * 86400000).length, t("statWeek")],
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}>
      <View style={st.top}><ProLogo /><Avatar uri={practice.logo_url} name={practice.name} size={42} /></View>
      <View><Txt v="small">{t("helloVet")},</Txt><Txt v="h1" numberOfLines={2}>{practice.name}</Txt></View>
      {error ? <Notice tone="bad" text={error} /> : null}

      <Glass style={{ flexDirection: "row", paddingVertical: 14 }}>
        {stats.map(([n, label], i) => (
          <View key={label} style={{ flex: 1, flexDirection: "row" }}>
            {i > 0 && <Divider vertical />}
            <View style={{ flex: 1, alignItems: "center", gap: 2 }} accessible accessibilityLabel={`${n} ${label}`}>
              <Text style={[st.statN, i === 1 && n > 0 ? { color: "#0E8F89" } : null]}>{n}</Text>
              <Text style={st.statL}>{label}</Text>
            </View>
          </View>
        ))}
      </Glass>

      {waiting > 0 && (
        <Card onPress={() => router.push("/v/requests")} accessibilityLabel={t("requests")} style={st.alert}>
          <View style={st.alertIco}><Icon name="bell-ring-outline" size={22} color={C.warn} /></View>
          <View style={{ flex: 1 }}><Txt v="strong">{t("requests")}</Txt><Txt v="small">{waiting} {t("statPending")}</Txt></View>
          <Icon name="arrow-right" size={22} color={C.blue} />
        </Card>
      )}
      {push === "off" && (
        <Card style={{ gap: 10 }}>
          <Txt v="small">{t("notifWhyVet")}</Txt>
          <PillButton small icon="bell-outline" label={t("notifEnable")} onPress={() => registerPush(lang, true).then(setPush)} />
        </Card>
      )}
      {push === "denied" && <Notice text={t("notifDenied")} />}

      {next ? (
        <DeepPanel ecg>
          <View style={{ padding: 20, gap: 12 }}>
            <Eyebrow deep>{t("nextUp")}</Eyebrow>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
              <Text style={st.bigHour}>{hour(next.starts_at, lang, tz)}</Text>
              <Text style={st.bigDay}>{dayKey(next.starts_at, tz) === todayKey ? t("today") : dayKey(next.starts_at, tz) === tomorrowKey ? t("tomorrow") : dayLabel(next.starts_at, lang, tz)}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Txt v="h3" color={C.white} numberOfLines={1}>{clientLine(next)}</Txt>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Icon name={TYPE_ICON[next.type] ?? "stethoscope"} size={17} color="#D9ECFF" /><Txt v="small" color="#D9ECFF" numberOfLines={1} style={{ flex: 1 }}>{[t(typeKey(next.type)), serviceName(next, t)].join(" · ")}</Txt></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {next.type === "video" && <PillButton kind="white" small icon="video-outline" label={t("openVideo")} loading={opening} onPress={async () => { setOpening(true); setNote(""); const m = await openVideo(next.id, t, lang); setOpening(false); if (m) setNote(m); }} style={{ alignSelf: "flex-start" }} />}
              <PillButton kind={next.type === "video" ? "ghost" : "white"} small arrow label={t("appointment")} onPress={() => open(next)} style={{ alignSelf: "flex-start" }} accessibilityLabel={`${t("appointment")}: ${longDateTime(next.starts_at, lang, tz)}`} />
            </View>
            {note ? <View style={st.note}><Text style={st.noteTxt}>{note}</Text></View> : null}
          </View>
        </DeepPanel>
      ) : null}

      <Eyebrow>{t("agenda")}</Eyebrow>
      {confirmed.length === 0 ? <Empty icon="calendar-blank-outline" text={t("noAppts")} /> : groups.size === 0 ? null : [...groups.entries()].map(([k, list]) => (
        <View key={k} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Txt v="h3">{k === todayKey ? t("today") : k === tomorrowKey ? t("tomorrow") : dayLabel(list[0].starts_at, lang, tz)}</Txt>
            <Pill tone="info" label={String(list.length)} />
          </View>
          {list.map((b) => <BookingRow key={b.id} b={b} tz={tz} onPress={() => open(b)} />)}
        </View>
      ))}
    </Screen>
  );
}

function ProLogo() {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Logo width={124} /><View style={st.pro}><Text style={st.proTxt}>PRO</Text></View></View>;
}

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  pro: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: C.aqua },
  proTxt: { fontFamily: F.bold, fontSize: 11.5, letterSpacing: 1, color: C.night },
  statN: { fontFamily: F.bold, fontSize: 26, lineHeight: 31, color: C.blue },
  statL: { fontFamily: F.semi, fontSize: 12, color: "#1B3FB8", textAlign: "center" },
  alert: { flexDirection: "row", alignItems: "center", gap: 12, borderColor: "#F3DFA6" },
  alertIco: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.warnBg, alignItems: "center", justifyContent: "center" },
  bigHour: { fontFamily: F.bold, fontSize: 40, lineHeight: 44, color: C.white, letterSpacing: -1 },
  bigDay: { fontFamily: F.semi, fontSize: 15, color: "#BFF3F0", paddingBottom: 7, textTransform: "capitalize", flexShrink: 1 },
  note: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 14, padding: 12 },
  noteTxt: { fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: C.white },
});
