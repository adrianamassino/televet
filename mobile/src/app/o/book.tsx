import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/Screen";
import { Card, Choice, Empty, Field, Icon, IconButton, IconTile, Loading, Notice, PillButton, Txt } from "@/components/ui";
import { SPECIES, SPECIES_ICON, TYPE_ICON, apiMessage, speciesKey, typeKey } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { API_URL, SCHEME } from "@/lib/config";
import { addDays, dayNum, hour, longDateTime, money, monthLabel, shortDay, todayYmd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { sb } from "@/lib/supabase";
import { C, F, shadow } from "@/lib/theme";
import type { Pet, PracticeDetail, Slot } from "@/lib/types";

type Payment = null | { provider: "stripe"; clientSecret: string } | { provider: "mercadopago"; redirectUrl: string };

/**
 * Booking: pick a time → pet and reason → (online payment) → request sent.
 * The server re-checks availability, the home-visit zone and the price; payment happens on a Televet page opened in a browser sheet.
 */
export default function Book() {
  const { practiceId, vetId, serviceId } = useLocalSearchParams<{ practiceId: string; vetId: string; serviceId: string }>();
  const { t, lang, country } = useI18n(), { session } = useSession(), router = useRouter();

  const [detail, setDetail] = useState<PracticeDetail | null>(null), [loadErr, setLoadErr] = useState("");
  const [week, setWeek] = useState(0), [slots, setSlots] = useState<Slot[] | null>(null), [day, setDay] = useState(""), [slot, setSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<"slot" | "details">("slot"), [wantDetails, setWantDetails] = useState(false);
  const [pets, setPets] = useState<Pet[] | null>(null), [petId, setPetId] = useState("new"), [petName, setPetName] = useState(""), [species, setSpecies] = useState<string>("dog");
  const [motive, setMotive] = useState(""), [address, setAddress] = useState(""), [access, setAccess] = useState(""), [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const [pending, setPending] = useState<{ bookingId: string; url: string } | null>(null);

  const svc = detail?.services.find((s) => s.id === serviceId), tz = detail?.practice.timezone;
  const vet = detail?.vets.find((v) => v.id === vetId);

  useEffect(() => {
    api<PracticeDetail>(`/api/app/practices/${practiceId}?vet=${vetId}`, { auth: false }).then(setDetail).catch((e) => setLoadErr(apiMessage(e, t)));
  }, [practiceId, vetId, t]);

  const loadSlots = useCallback(async () => {
    setSlots(null);
    try {
      const r = await api<{ slots: Slot[] }>(`/api/availability?service=${serviceId}&practitioner=${vetId}&from=${addDays(todayYmd(), week * 7)}&days=7`, { auth: false });
      setSlots(r.slots); setDay((cur) => (r.slots.some((s) => s.day === cur) ? cur : r.slots[0]?.day ?? ""));
    } catch (e) { setSlots([]); setMsg(apiMessage(e, t)); }
  }, [serviceId, vetId, week, t]);
  useEffect(() => { loadSlots(); }, [loadSlots]);
  const days = useMemo(() => [...new Set((slots ?? []).map((s) => s.day))], [slots]);
  const times = useMemo(() => (slots ?? []).filter((s) => s.day === day), [slots, day]);

  // step 2 needs an account: sign in (or create one), then come straight back here
  const uid = session?.user.id;
  useEffect(() => {
    if (!wantDetails || !uid) return;
    setWantDetails(false); setStep("details");
    (async () => {
      await sb().from("owners").upsert({ id: uid, full_name: (session?.user.user_metadata?.full_name as string | undefined) ?? "", country, language: lang }, { onConflict: "id", ignoreDuplicates: true });
      const { data } = await sb().from("pets").select("id, name, species").order("created_at");
      const list = (data ?? []) as Pet[];
      setPets(list); setPetId(list[0]?.id ?? "new");
    })().catch(() => setPets([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantDetails, uid]);
  const toDetails = () => { setMsg(""); setWantDetails(true); if (!session) router.push({ pathname: "/login", params: { back: "1" } }); };

  async function pay(bookingId: string, url: string) {
    if (Platform.OS === "web") return; // browser preview: there is no app to come back to
    const res = await WebBrowser.openAuthSessionAsync(url, `${SCHEME}://paid`, { preferEphemeralSession: true }).catch(() => null);
    if (res?.type !== "success") return; // sheet closed: the "payment not completed" card stays
    const status = /[?&]status=([a-z]+)/i.exec(res.url)?.[1] ?? "ok";
    if (status === "cancel") return;
    router.replace({ pathname: "/paid", params: { booking: bookingId, status } });
  }

  async function submit() {
    if (!svc || !slot || !uid) return;
    setBusy(true); setMsg("");
    try {
      let pid = petId;
      if (pid === "new") {
        const { data: p, error } = await sb().from("pets").insert({ owner_id: uid, name: petName.trim(), species }).select("id").single();
        if (error) throw error;
        pid = p.id as string; setPets((cur) => [...(cur ?? []), { id: pid, name: petName.trim(), species }]); setPetId(pid);
      }
      const r = await api<{ bookingId: string; payment: Payment }>("/api/bookings", {
        body: { serviceId: svc.id, practitionerId: vetId, start: slot.start, petId: pid, motive: motive.trim() || undefined, address: svc.type === "home" ? address.trim() : undefined, accessNotes: access.trim() || undefined, transcriptConsent: svc.type === "video" ? consent : undefined, source: "app" },
      });
      if (!r.payment) { router.replace({ pathname: "/paid", params: { booking: r.bookingId, status: "ok" } }); return; }
      const url = r.payment.provider === "stripe"
        ? `${API_URL}/m/pay?lang=${lang}&booking=${r.bookingId}&scheme=${SCHEME}#cs=${encodeURIComponent(r.payment.clientSecret)}`
        : r.payment.redirectUrl;
      setPending({ bookingId: r.bookingId, url });
      await pay(r.bookingId, url);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "";
      if (code === "slot_unavailable") { setMsg(t("taken")); setSlot(null); setStep("slot"); loadSlots(); }
      else setMsg(code === "out_of_zone" ? t("zone") : code === "payments_not_enabled" ? t("nopay") : apiMessage(e, t));
    } finally { setBusy(false); }
  }

  async function cancelPending() {
    if (!pending) return;
    setBusy(true);
    try { await api(`/api/bookings/${pending.bookingId}/cancel`, { method: "POST", body: {} }); setPending(null); setSlot(null); setStep("slot"); loadSlots(); }
    catch (e) { setMsg(apiMessage(e, t)); }
    finally { setBusy(false); }
  }

  if (loadErr) return <Screen top={false}><Notice tone="bad" text={loadErr} /><PillButton kind="outline" label={t("back")} onPress={() => router.back()} /></Screen>;
  if (!detail) return <Screen top={false}><Loading /></Screen>;
  if (!svc) return <Screen top={false}><Empty icon="calendar-remove-outline" text={t("notFound")} action={<PillButton kind="outline" label={t("back")} onPress={() => router.back()} />} /></Screen>;

  const needsPay = svc.onlinePayment, cantPay = needsPay && !detail.practice.paymentsReady;
  const detailsOk = (petId !== "new" || petName.trim().length > 0) && (svc.type !== "home" || address.trim().length > 5) && !cantPay;
  const summary = (
    <Card style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
      <IconTile name={TYPE_ICON[svc.type] ?? "stethoscope"} tone={svc.type === "video" ? "teal" : "blue"} />
      <View style={{ flex: 1 }}>
        <Txt v="h3">{svc.name ?? t(typeKey(svc.type))}</Txt>
        <Txt v="small" numberOfLines={2}>{[vet?.name ?? detail.practice.name, `${svc.duration} ${t("min")}`].join(" · ")}</Txt>
        {slot && step === "details" && <Text style={st.when}>{longDateTime(slot.start, lang, tz)}</Text>}
      </View>
      <Text style={st.price}>{money(svc.price, svc.currency, lang)}</Text>
    </Card>
  );

  if (pending) return (
    <Screen top={false}>
      {summary}
      <Card style={{ gap: 12, alignItems: "center", paddingVertical: 24 }}>
        <View style={st.bigIco}><Icon name="credit-card-clock-outline" size={32} color={C.blue} /></View>
        <Txt v="h2" center>{t("payPendingT")}</Txt>
        <Txt v="body" color={C.soft} center>{t("payPendingP")}</Txt>
      </Card>
      {msg ? <Notice tone="bad" text={msg} /> : null}
      <PillButton label={t("payRetry")} arrow onPress={() => pay(pending.bookingId, pending.url)} disabled={busy} />
      <PillButton kind="danger" label={t("cancelRequest")} onPress={cancelPending} loading={busy} />
    </Screen>
  );

  if (step === "slot") return (
    <Screen top={false} footer={<Footer><PillButton label={session ? t("next") : t("loginToBook")} arrow disabled={!slot} onPress={toDetails} /></Footer>}>
      {summary}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Txt v="h2">{t("pickSlot")}</Txt>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ opacity: week === 0 ? 0.35 : 1 }}><IconButton name="chevron-left" label={t("prevWeek")} onPress={week === 0 ? undefined : () => { setSlot(null); setWeek(week - 1); }} /></View>
          <IconButton name="chevron-right" label={t("nextWeek")} onPress={() => { setSlot(null); setWeek(week + 1); }} />
        </View>
      </View>
      {msg ? <Notice tone="bad" text={msg} /> : null}
      {slots === null ? <Loading /> : days.length === 0 ? <Empty icon="calendar-blank-outline" text={t("noSlots")} action={<PillButton kind="outline" small arrow label={t("nextWeek")} onPress={() => setWeek(week + 1)} />} /> : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 8 }} style={{ marginHorizontal: -20, paddingHorizontal: 20, flexGrow: 0 }}>
            {days.map((d) => {
              const on = d === day, first = (slots ?? []).find((s) => s.day === d)!.start;
              return (
                <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={longDateTime(first, lang, tz)} onPress={() => { setDay(d); setSlot(null); }}
                  style={({ pressed }) => [st.day, on ? [st.dayOn, shadow("lift")] : null, pressed ? { opacity: 0.8 } : null]}>
                  <Text style={[st.dayW, on ? { color: "#D9ECFF" } : null]}>{shortDay(first, lang, tz)}</Text>
                  <Text style={[st.dayN, on ? { color: C.white } : null]}>{dayNum(first, lang, tz)}</Text>
                  <Text style={[st.dayW, on ? { color: "#D9ECFF" } : null]}>{monthLabel(first, lang, tz)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {times.map((s) => {
              const on = slot?.start === s.start;
              return (
                <Pressable key={s.start} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={hour(s.start, lang, tz)} onPress={() => setSlot(s)} style={({ pressed }) => [st.time, on ? st.timeOn : null, pressed ? { opacity: 0.8 } : null]}>
                  <Text style={[st.timeTxt, on ? { color: C.white } : null]}>{hour(s.start, lang, tz)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );

  return (
    <Screen top={false} footer={<Footer><PillButton label={t(needsPay ? "paySend" : "send")} arrow loading={busy} disabled={!detailsOk} onPress={submit} /></Footer>}>
      {summary}
      <PillButton kind="quiet" small icon="pencil-outline" label={t("changeSlot")} onPress={() => setStep("slot")} style={{ alignSelf: "flex-start", marginTop: -8 }} />
      <Txt v="h2">{t("yourPet")}</Txt>
      {pets === null ? <Loading /> : (
        <>
          <Choice wrap value={petId} onChange={setPetId} options={[...pets.map((p) => ({ value: p.id, label: p.name, icon: SPECIES_ICON[p.species] ?? "paw" })), { value: "new", label: t("newPet"), icon: "plus" as const }]} />
          {petId === "new" && (
            <Card style={{ gap: 12 }}>
              <Field label={t("petName")} value={petName} onChangeText={setPetName} autoCapitalize="words" maxLength={40} />
              <Choice wrap value={species} onChange={setSpecies} options={SPECIES.map((s) => ({ value: s as string, label: t(speciesKey(s)) }))} />
            </Card>
          )}
        </>
      )}
      <Field label={t("motive")} placeholder={t("motivePh")} value={motive} onChangeText={setMotive} multiline maxLength={1000} />
      {svc.type === "home" && <>
        <Field label={t("address")} value={address} onChangeText={setAddress} autoComplete="street-address" textContentType="fullStreetAddress" maxLength={300} />
        <Field label={t("access")} value={access} onChangeText={setAccess} maxLength={300} />
      </>}
      {svc.type === "video" && (
        <Card style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Txt v="small" style={{ flex: 1, color: C.ink }}>{t("consent")}</Txt>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: C.azure, false: "#CBD6EA" }} thumbColor={C.white} accessibilityLabel={t("consent")} />
        </Card>
      )}
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Txt v="h3">{t("total")}</Txt><Text style={st.price}>{money(svc.price, svc.currency, lang)}</Text></View>
        <Txt v="small">{needsPay ? t("notCharged") : t("payAtVisit")}</Txt>
      </Card>
      {cantPay && <Notice text={t("nopay")} />}
      {msg ? <Notice tone="bad" text={msg} /> : null}
    </Screen>
  );
}

/** Button bar pinned to the bottom of the screen. */
function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[st.footer, { paddingBottom: insets.bottom + 14 }]}><View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>{children}</View></View>;
}

const st = StyleSheet.create({
  price: { fontFamily: F.bold, fontSize: 18, color: C.navy },
  when: { fontFamily: F.semi, fontSize: 14, color: C.blue, marginTop: 3 },
  bigIco: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  day: { width: 66, paddingVertical: 10, borderRadius: 20, alignItems: "center", backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, gap: 1 },
  dayOn: { backgroundColor: C.blue, borderColor: C.blue },
  dayW: { fontFamily: F.semi, fontSize: 12, color: C.soft, textTransform: "capitalize" },
  dayN: { fontFamily: F.bold, fontSize: 21, lineHeight: 26, color: C.navy },
  time: { minWidth: 86, minHeight: 46, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: C.white, borderWidth: 1.5, borderColor: "#C9DBF7" },
  timeOn: { backgroundColor: C.blue, borderColor: C.blue },
  timeTxt: { fontFamily: F.semi, fontSize: 15.5, color: C.blue },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: "rgba(248,251,255,0.96)", borderTopWidth: 1, borderTopColor: "#E2ECFB" },
});
