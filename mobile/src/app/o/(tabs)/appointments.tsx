import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Confirm } from "@/components/Confirm";
import { Header, Screen } from "@/components/Screen";
import { Card, Empty, Icon, Loading, Notice, Pill, PillButton, Txt, statusTone } from "@/components/ui";
import type { CopyKey } from "@/copy";
import { TYPE_ICON, apiMessage, openVideo, typeKey, videoWindow } from "@/lib/actions";
import { api } from "@/lib/api";
import { dayNum, hour, money, monthLabel, shortDay } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { sb } from "@/lib/supabase";
import { C, F } from "@/lib/theme";
import type { OwnerBooking } from "@/lib/types";

/** The owner's appointments: what is coming (with the video button and the option to withdraw a request) and the history. */
export default function Appointments() {
  const { t, lang } = useI18n(), { session, ready } = useSession(), router = useRouter();
  const [list, setList] = useState<OwnerBooking[] | null>(null), [err, setErr] = useState(""), [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState<{ id: string; text: string } | null>(null), [opening, setOpening] = useState("");
  const [toCancel, setToCancel] = useState<OwnerBooking | null>(null), [busy, setBusy] = useState(false);

  const uid = session?.user.id;
  const load = useCallback(async () => {
    if (!uid) { setList(null); return; }
    setErr("");
    const { data, error } = await sb().from("bookings")
      .select("id, starts_at, ends_at, type, status, payment_status, price_cents, currency, vet_reply, practices(name, timezone), pets(name), practitioners(display_name)")
      .order("starts_at", { ascending: false }).limit(100);
    if (error) { setErr(t("netErr")); setList((cur) => cur ?? []); return; }
    setList((data ?? []) as unknown as OwnerBooking[]);
  }, [uid, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (ready && !session) return (
    <Screen><Header title={t("tabAppointments")} />
      <Empty icon="calendar-heart" text={t("signInAppointments")} action={<PillButton label={t("signIn")} arrow onPress={() => router.push({ pathname: "/login", params: { back: "1" } })} style={{ alignSelf: "center", minWidth: 220 }} />} />
    </Screen>
  );

  const now = Date.now();
  const live = (b: OwnerBooking) => (b.status === "pending" || b.status === "confirmed") && Date.parse(b.ends_at) + 3600000 > now;
  const upcoming = (list ?? []).filter(live).sort((a, b) => a.starts_at.localeCompare(b.starts_at)), past = (list ?? []).filter((b) => !live(b));

  async function join(b: OwnerBooking) {
    setOpening(b.id); setNote(null);
    const m = await openVideo(b.id, t, lang);
    setOpening(""); if (m) setNote({ id: b.id, text: m });
  }
  async function cancel() {
    if (!toCancel) return;
    setBusy(true);
    try { await api(`/api/bookings/${toCancel.id}/cancel`, { method: "POST", body: {} }); setToCancel(null); await load(); }
    catch (e) { setToCancel(null); setErr(apiMessage(e, t)); }
    finally { setBusy(false); }
  }

  const card = (b: OwnerBooking, active: boolean) => {
    const tz = b.practices?.timezone, isVideo = b.type === "video" || b.type === "expertise";
    const unpaid = b.status === "pending" && b.payment_status === "pending";
    return (
      <Card key={b.id} style={{ gap: 12, opacity: active ? 1 : 0.92 }}>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={[st.date, active ? null : { backgroundColor: "#EEF1F8" }]}>
            <Text style={st.dateW}>{shortDay(b.starts_at, lang, tz)}</Text>
            <Text style={[st.dateN, active ? null : { color: C.soft }]}>{dayNum(b.starts_at, lang, tz)}</Text>
            <Text style={st.dateW}>{monthLabel(b.starts_at, lang, tz)}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Txt v="h3" numberOfLines={2}>{b.practices?.name ?? "Televet"}</Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name={TYPE_ICON[b.type] ?? "stethoscope"} size={16} color={C.soft} />
              <Txt v="small" numberOfLines={1} style={{ flex: 1 }}>{[t(typeKey(b.type)), b.pets?.name].filter(Boolean).join(" · ")}</Txt>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
              <Text style={st.hour}>{hour(b.starts_at, lang, tz)}</Text>
              <Pill tone={unpaid ? "wait" : statusTone(b.status)} label={unpaid ? t("payPendingT") : t((`s_${b.status}`) as CopyKey)} />
              <Txt v="small">{money(b.price_cents, b.currency, lang)}</Txt>
            </View>
          </View>
        </View>
        {b.status === "declined" && b.vet_reply ? <View style={st.reply}><Txt v="tiny">{t("vetReply")}</Txt><Txt v="body" style={{ fontSize: 15, lineHeight: 21 }}>{b.vet_reply}</Txt></View> : null}
        {active && b.status === "confirmed" && isVideo && (
          <PillButton icon="video-outline" label={t("joinVideo")} kind={videoWindow(b.starts_at, b.ends_at) ? "primary" : "outline"} small loading={opening === b.id} onPress={() => join(b)} />
        )}
        {note?.id === b.id && <Notice text={note.text} />}
        {active && b.status === "pending" && <PillButton kind="quiet" small label={t("cancelRequest")} onPress={() => setToCancel(b)} style={{ alignSelf: "flex-start", marginVertical: -6 }} />}
      </Card>
    );
  };

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Header title={t("tabAppointments")} />
      {err ? <Notice tone="bad" text={err} /> : null}
      {list === null ? <Loading /> : (
        <>
          <Txt v="h3" color={C.soft}>{t("upcoming")}</Txt>
          {upcoming.length === 0 ? <Empty icon="calendar-blank-outline" text={t("noUpcoming")} action={<PillButton kind="outline" small arrow label={t("findVet")} onPress={() => router.push("/o")} />} /> : upcoming.map((b) => card(b, true))}
          {past.length > 0 && <><Txt v="h3" color={C.soft} style={{ marginTop: 8 }}>{t("past")}</Txt>{past.map((b) => card(b, false))}</>}
        </>
      )}
      <Confirm visible={!!toCancel} title={t("cancelRequest")} text={t("cancelAsk")} confirmLabel={t("cancelRequest")} cancelLabel={t("back")} danger busy={busy} onConfirm={cancel} onCancel={() => setToCancel(null)} />
    </Screen>
  );
}

const st = StyleSheet.create({
  date: { width: 62, borderRadius: 18, backgroundColor: C.tint, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  dateW: { fontFamily: F.semi, fontSize: 11.5, color: C.soft, textTransform: "capitalize" },
  dateN: { fontFamily: F.bold, fontSize: 22, lineHeight: 26, color: C.blue },
  hour: { fontFamily: F.bold, fontSize: 16, color: C.navy },
  reply: { backgroundColor: "#F4F7FD", borderRadius: 14, padding: 12, gap: 2 },
});
