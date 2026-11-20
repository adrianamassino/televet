import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DeepPanel } from "@/components/Backdrop";
import { Screen } from "@/components/Screen";
import { Avatar, Card, Choice, Empty, Eyebrow, Icon, IconTile, Loading, Notice, Pill, PillButton, Txt } from "@/components/ui";
import type { CopyKey } from "@/copy";
import { TYPE_ICON, apiMessage, callPhone, typeKey } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { C, F } from "@/lib/theme";
import type { PracticeDetail, Service } from "@/lib/types";

/** Public profile of a clinic or vet: who they are, the team, and the consultations that can be booked. */
export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n(), router = useRouter();
  const [data, setData] = useState<PracticeDetail | null>(null), [vetId, setVetId] = useState(""), [services, setServices] = useState<Service[] | null>(null);
  const [err, setErr] = useState(""), [gone, setGone] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      const d = await api<PracticeDetail>(`/api/app/practices/${id}`, { auth: false });
      setData(d); setVetId((cur) => cur || d.vets[0]?.id || "");
      if (d.vets.length === 0) setServices([]);
    } catch (e) { if (e instanceof ApiError && e.status === 404) setGone(true); else setErr(apiMessage(e, t)); }
  }, [id, t]);
  useEffect(() => { load(); }, [load]);

  // services and exact prices of the chosen vet
  useEffect(() => {
    if (!vetId) return;
    let alive = true; setServices(null);
    api<PracticeDetail>(`/api/app/practices/${id}?vet=${vetId}`, { auth: false })
      .then((d) => { if (alive) setServices(d.services); })
      .catch((e) => { if (alive) { setServices([]); setErr(apiMessage(e, t)); } });
    return () => { alive = false; };
  }, [id, vetId, t]);

  if (gone) return <Screen top={false}><Empty icon="map-marker-off-outline" text={t("notFound")} action={<PillButton kind="outline" label={t("back")} onPress={() => router.back()} />} /></Screen>;
  if (!data) return <Screen top={false}>{err ? <><Notice tone="bad" text={err} /><PillButton kind="outline" label={t("retry")} onPress={load} /></> : <Loading />}</Screen>;
  const p = data.practice, kind = (`k_${["clinic", "vet", "home"].includes(p.kind) ? p.kind : "vet"}`) as CopyKey;
  const place = [p.address, [p.postalCode, p.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return (
    <Screen top={false}>
      <Stack.Screen options={{ title: p.name }} />
      <DeepPanel>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={st.ring}><Avatar uri={p.logoUrl} name={p.name} size={64} /></View>
            <View style={{ flex: 1 }}>
              <Txt v="h2" color={C.white}>{p.name}</Txt>
              <Txt v="small" color="#D9ECFF">{t(kind)}</Txt>
            </View>
          </View>
          {p.headline ? <Txt v="body" color="#EAF4FF" style={{ fontSize: 15, lineHeight: 21 }}>{p.headline}</Txt> : null}
          {place ? <View style={st.line}><Icon name="map-marker-outline" size={18} color="#BFE9FF" /><Text style={st.lineTxt}>{place}</Text></View> : null}
          {p.phone ? <PillButton kind="white" small icon="phone-outline" label={`${t("call")} ${p.phone}`} onPress={() => callPhone(p.phone!)} style={{ alignSelf: "flex-start" }} /> : null}
        </View>
      </DeepPanel>

      {p.about ? <Card style={{ gap: 6 }}><Eyebrow>{t("about")}</Eyebrow><Txt v="body" color={C.soft} style={{ fontSize: 15.5 }}>{p.about}</Txt></Card> : null}

      {data.vets.length > 1 && (
        <View style={{ gap: 10 }}>
          <Txt v="h3">{t("chooseVet")}</Txt>
          <Choice wrap value={vetId} onChange={setVetId} options={data.vets.map((v) => ({ value: v.id, label: v.name }))} />
        </View>
      )}
      {data.vets.filter((v) => v.id === vetId).map((v) => (
        <Card key={v.id} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar uri={v.photoUrl} name={v.name} size={48} />
          <View style={{ flex: 1 }}><Txt v="h3">{v.name}</Txt>{v.specialties.length > 0 && <Txt v="small" numberOfLines={2}>{v.specialties.join(" · ")}</Txt>}</View>
        </Card>
      ))}

      <View style={{ gap: 10 }}>
        <Eyebrow>{t("services")}</Eyebrow>
        {!p.bookable && <Notice text={t("notBookable")} />}
        {err ? <Notice tone="bad" text={err} /> : null}
        {services === null ? <Loading /> : services.length === 0 ? <Empty icon="calendar-blank-outline" text={t("noServices")} /> : services.map((s) => {
          const blocked = !p.bookable || (s.onlinePayment && !p.paymentsReady);
          return (
            <Card key={s.id} accessibilityLabel={`${s.name ?? t(typeKey(s.type))}, ${money(s.price, s.currency, lang)}`} style={{ gap: 10, opacity: blocked ? 0.6 : 1 }}
              onPress={blocked ? undefined : () => router.push({ pathname: "/o/book", params: { practiceId: p.id, vetId, serviceId: s.id } })}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <IconTile name={TYPE_ICON[s.type] ?? "stethoscope"} tone={s.type === "video" ? "teal" : "blue"} />
                <View style={{ flex: 1 }}>
                  <Txt v="h3">{s.name ?? t(typeKey(s.type))}</Txt>
                  <Txt v="small">{t(typeKey(s.type))} · {s.duration} {t("min")}</Txt>
                </View>
                <Text style={st.price}>{money(s.price, s.currency, lang)}</Text>
              </View>
              {s.description ? <Txt v="body" color={C.soft} numberOfLines={3} style={{ fontSize: 15, lineHeight: 21 }}>{s.description}</Txt> : null}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Pill tone={s.onlinePayment ? "info" : "mute"} icon={s.onlinePayment ? "credit-card-outline" : "cash"} label={t(s.onlinePayment ? "payOnline" : "payAtVisit")} />
                {!blocked && <View style={st.book}><Text style={st.bookTxt}>{t("book")}</Text><Icon name="arrow-right" size={17} color={C.white} /></View>}
              </View>
              {s.onlinePayment && !p.paymentsReady && p.bookable && <Txt v="tiny">{t("nopay")}</Txt>}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  ring: { padding: 3, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.35)" },
  line: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  lineTxt: { flex: 1, fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: "#EAF4FF" },
  price: { fontFamily: F.bold, fontSize: 18, color: C.navy },
  book: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, minHeight: 36, borderRadius: 999, backgroundColor: C.blue },
  bookTxt: { fontFamily: F.semi, fontSize: 14, color: C.white },
});
