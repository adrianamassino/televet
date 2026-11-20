import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Confirm } from "@/components/Confirm";
import { ProGate, clientLine, serviceName } from "@/components/pro";
import { Header, Screen } from "@/components/Screen";
import { Card, Empty, Field, Icon, IconTile, Notice, Pill, PillButton, Txt } from "@/components/ui";
import type { CopyKey } from "@/copy";
import { TYPE_ICON, apiMessage, typeKey } from "@/lib/actions";
import { ApiError } from "@/lib/api";
import { longDateTime, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { isRequest, usePro } from "@/lib/pro";
import { C, F } from "@/lib/theme";
import type { ProBooking } from "@/lib/types";

/** Appointment requests waiting for the vet: accept (the payment is captured, the client is told) or decline with an optional message. */
export default function Requests() {
  const { t, lang } = useI18n(), router = useRouter(), { practice, bookings, reload, act } = usePro();
  const [refreshing, setRefreshing] = useState(false), [busy, setBusy] = useState(""), [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "info" } | null>(null);
  const [toDecline, setToDecline] = useState<ProBooking | null>(null), [reply, setReply] = useState("");
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  if (!practice || !bookings) return <Screen><Header title={t("tabRequests")} /><ProGate /></Screen>;
  const tz = practice.timezone;
  const list = bookings.filter(isRequest).sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  async function run(b: ProBooking, action: "confirm" | "decline") {
    setBusy(b.id + action); setMsg(null);
    try { await act(b.id, action, reply); setMsg({ text: t(action === "confirm" ? "s_confirmed" : "s_declined"), tone: "ok" }); }
    catch (e) { setMsg(e instanceof ApiError && e.status === 409 ? { text: t("alreadyHandled"), tone: "info" } : { text: apiMessage(e, t), tone: "bad" }); }
    finally { setBusy(""); setToDecline(null); setReply(""); }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}>
      <Header title={t("tabRequests")} right={list.length > 0 ? <Pill tone="wait" label={String(list.length)} /> : undefined} />
      {msg && <Notice text={msg.text} tone={msg.tone} />}
      {list.length === 0 ? <Empty icon="bell-check-outline" text={t("noRequests")} /> : list.map((b) => (
        <Card key={b.id} style={{ gap: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${t("appointment")}: ${clientLine(b)}`} onPress={() => router.push({ pathname: "/v/booking/[id]", params: { id: b.id } })} style={({ pressed }) => [{ gap: 10 }, pressed ? { opacity: 0.8 } : null]}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <IconTile name={TYPE_ICON[b.type] ?? "stethoscope"} tone={b.type === "video" ? "teal" : "blue"} />
              <View style={{ flex: 1 }}>
                <Text style={st.when}>{longDateTime(b.starts_at, lang, tz)}</Text>
                <Txt v="small" numberOfLines={1}>{[t(typeKey(b.type)), serviceName(b, t)].join(" · ")}</Txt>
              </View>
              <Icon name="chevron-right" size={22} color={C.mute} />
            </View>
            <Txt v="h3" numberOfLines={1}>{clientLine(b)}</Txt>
            {b.motive ? <Txt v="body" color={C.soft} numberOfLines={3} style={{ fontSize: 15, lineHeight: 21 }}>{b.motive}</Txt> : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={st.price}>{money(b.price_cents, b.currency, lang)}</Text>
              <Pill tone={b.payment_status === "none" ? "mute" : "ok"} icon={b.payment_status === "none" ? "cash" : "credit-card-check-outline"} label={t((`p_${b.payment_status}`) as CopyKey)} />
            </View>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <PillButton kind="danger" small label={t("decline")} disabled={!!busy} onPress={() => { setReply(""); setToDecline(b); }} style={{ flex: 1 }} />
            <PillButton small icon="check" label={t("accept")} loading={busy === b.id + "confirm"} disabled={!!busy && busy !== b.id + "confirm"} onPress={() => run(b, "confirm")} style={{ flex: 1.4 }} />
          </View>
        </Card>
      ))}
      <Confirm visible={!!toDecline} danger busy={!!toDecline && busy === toDecline.id + "decline"} title={t("declineConfirm")} text={t("declineNote")} confirmLabel={t("decline")} cancelLabel={t("cancel")}
        onCancel={() => setToDecline(null)} onConfirm={() => toDecline && run(toDecline, "decline")}>
        <Field label={t("declineReason")} value={reply} onChangeText={setReply} multiline maxLength={300} />
      </Confirm>
    </Screen>
  );
}

const st = StyleSheet.create({
  when: { fontFamily: F.bold, fontSize: 15.5, lineHeight: 21, color: C.navy },
  price: { fontFamily: F.bold, fontSize: 17, color: C.navy },
});
