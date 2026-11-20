import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DeepPanel } from "@/components/Backdrop";
import { Confirm } from "@/components/Confirm";
import { ProGate, serviceName } from "@/components/pro";
import { Screen } from "@/components/Screen";
import { Card, Empty, Field, Icon, Notice, Pill, PillButton, Row, Txt, statusTone } from "@/components/ui";
import type { CopyKey } from "@/copy";
import { SPECIES_ICON, TYPE_ICON, apiMessage, callPhone, openMap, openVideo, speciesKey, typeKey } from "@/lib/actions";
import { ApiError } from "@/lib/api";
import { dayLabel, hour, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { isRequest, usePro } from "@/lib/pro";
import { C, F } from "@/lib/theme";

/** One appointment for the vet: who, when, why, where, payment — with accept / decline, the video room, a call and directions. */
export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n(), router = useRouter(), { practice, bookings, reload, act } = usePro();
  const [busy, setBusy] = useState(""), [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "info" } | null>(null);
  const [declining, setDeclining] = useState(false), [reply, setReply] = useState("");
  const b = bookings?.find((x) => x.id === id);
  // opened from a notification before the list knows this booking: fetch again once
  useEffect(() => { if (bookings && !b) reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if (!practice || !bookings) return <Screen top={false}><ProGate /></Screen>;
  if (!b) return <Screen top={false}><Empty icon="calendar-remove-outline" text={t("notFound")} action={<PillButton kind="outline" label={t("back")} onPress={() => router.back()} />} /></Screen>;
  const tz = practice.timezone, isVideo = b.type === "video" || b.type === "expertise", ended = Date.parse(b.ends_at) + 3600000 < Date.now();

  async function run(action: "confirm" | "decline") {
    setBusy(action); setMsg(null);
    try { await act(b!.id, action, reply); setMsg({ text: t(action === "confirm" ? "s_confirmed" : "s_declined"), tone: "ok" }); }
    catch (e) { setMsg(e instanceof ApiError && e.status === 409 ? { text: t("alreadyHandled"), tone: "info" } : { text: apiMessage(e, t), tone: "bad" }); }
    finally { setBusy(""); setDeclining(false); setReply(""); }
  }
  async function video() {
    setBusy("video"); setMsg(null);
    const m = await openVideo(b!.id, t, lang);
    setBusy(""); if (m) setMsg({ text: m, tone: "info" });
  }

  return (
    <Screen top={false}>
      <DeepPanel>
        <View style={{ padding: 20, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name={TYPE_ICON[b.type] ?? "stethoscope"} size={20} color="#D9ECFF" />
            <Txt v="small" color="#D9ECFF" style={{ flex: 1 }} numberOfLines={1}>{[t(typeKey(b.type)), serviceName(b, t)].join(" · ")}</Txt>
            <Pill tone={statusTone(b.status)} label={t((`s_${b.status}`) as CopyKey)} />
          </View>
          <Text style={st.hour}>{hour(b.starts_at, lang, tz)} – {hour(b.ends_at, lang, tz)}</Text>
          <Txt v="h3" color={C.white}>{dayLabel(b.starts_at, lang, tz)}</Txt>
        </View>
      </DeepPanel>

      {msg && <Notice text={msg.text} tone={msg.tone} />}
      {isRequest(b) && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PillButton kind="danger" label={t("decline")} disabled={!!busy} onPress={() => setDeclining(true)} style={{ flex: 1 }} />
          <PillButton icon="check" label={t("accept")} loading={busy === "confirm"} disabled={!!busy && busy !== "confirm"} onPress={() => run("confirm")} style={{ flex: 1.4 }} />
        </View>
      )}
      {b.status === "confirmed" && isVideo && !ended && <PillButton icon="video-outline" label={t("openVideo")} loading={busy === "video"} onPress={video} />}

      <Card style={{ paddingVertical: 8 }}>
        <Row icon="account-outline" label={t("client")} value={b.owners?.full_name || "—"} />
        {b.owners?.phone ? <Row icon="phone-outline" label={t("callClient")} value={b.owners.phone} onPress={() => callPhone(b.owners!.phone!)} /> : null}
        {b.pets ? <Row icon={SPECIES_ICON[b.pets.species] ?? "paw"} label={t("pet")} value={`${b.pets.name} · ${t(speciesKey(b.pets.species))}`} /> : null}
      </Card>

      {b.motive ? <Card style={{ gap: 4 }}><Txt v="tiny">{t("reason")}</Txt><Txt v="body">{b.motive}</Txt></Card> : null}

      {b.address ? (
        <Card style={{ paddingVertical: 8 }}>
          <Row icon="map-marker-outline" label={t("addressLbl")} value={b.address} onPress={() => openMap(b.address!)} />
          {b.access_notes ? <View style={{ paddingLeft: 50, paddingBottom: 8 }}><Txt v="small">{b.access_notes}</Txt></View> : null}
        </Card>
      ) : null}

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}><Txt v="tiny">{t("payment")}</Txt><Text style={st.price}>{money(b.price_cents, b.currency, lang)}</Text></View>
        <Pill tone={b.payment_status === "captured" || b.payment_status === "authorized" ? "ok" : b.payment_status === "failed" ? "bad" : b.payment_status === "pending" ? "wait" : "mute"} label={t((`p_${b.payment_status}`) as CopyKey)} />
      </Card>

      <Confirm visible={declining} danger busy={busy === "decline"} title={t("declineConfirm")} text={t("declineNote")} confirmLabel={t("decline")} cancelLabel={t("cancel")} onCancel={() => setDeclining(false)} onConfirm={() => run("decline")}>
        <Field label={t("declineReason")} value={reply} onChangeText={setReply} multiline maxLength={300} />
      </Confirm>
    </Screen>
  );
}

const st = StyleSheet.create({
  hour: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, color: C.white, letterSpacing: -0.8 },
  price: { fontFamily: F.bold, fontSize: 20, color: C.navy },
});
