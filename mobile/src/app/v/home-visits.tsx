import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { Card, Choice, Field, Loading, Notice, Pill, PillButton, Txt } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { C } from "@/lib/theme";

type Zone = { mode: "radius"; label: string; lat: number; lng: number; km: number; extended: { km: number; feeCents: number } | null }
  | { mode: "postal"; codes: string[]; extended: { codes: string[]; feeCents: number } | null };
type Vet = { id: string; name: string; travelMin: number; hasHomeService: boolean; calendarConnected: boolean; zone: Zone | null };
type Data = { ready: boolean; country: string; currency: string; autoConfirm: boolean; vets: Vet[] };
type Place = { label: string; lat: number; lng: number };
const TRAVEL = [0, 15, 20, 30, 45, 60, 90];

/** Home-visit settings, the same as on the website: area each vet covers, travel time kept free around visits, automatic confirmation. */
export default function HomeVisits() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<Data | null>(null), [vetId, setVetId] = useState(""), [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" } | null>(null), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"radius" | "postal">("radius"), [q, setQ] = useState(""), [place, setPlace] = useState<Place | null>(null), [opts, setOpts] = useState<Place[]>([]);
  const [km, setKm] = useState("10"), [codes, setCodes] = useState(""), [wide, setWide] = useState(false), [wKm, setWKm] = useState("20"), [wCodes, setWCodes] = useState(""), [fee, setFee] = useState(""), [travel, setTravel] = useState(30);

  const fill = useCallback((d: Data, id: string) => {
    setData(d);
    const v = d.vets.find((x) => x.id === id) ?? d.vets[0]; if (!v) return;
    setVetId(v.id); setTravel(v.travelMin);
    const z = v.zone;
    setWide(!!z?.extended); setFee(z?.extended ? String(z.extended.feeCents / 100) : "");
    if (z?.mode === "postal") { setMode("postal"); setCodes(z.codes.join(", ")); setWCodes(z.extended?.codes.join(", ") ?? ""); setPlace(null); setQ(""); }
    else if (z?.mode === "radius") { setMode("radius"); setPlace({ label: z.label, lat: z.lat, lng: z.lng }); setQ(z.label); setKm(String(z.km)); setWKm(String(z.extended?.km ?? z.km * 2)); }
    else { setPlace(null); setQ(""); setCodes(""); setWCodes(""); }
  }, []);
  const err = (e: unknown) => { const c = e instanceof ApiError ? e.code : ""; return c === "invalid_zone" ? t("hvInvalid") : c === "database_not_updated" ? t("hvDbOld") : t("genericErr"); };
  useEffect(() => { api<Data>("/api/pro/home-visits").then((d) => fill(d, "")).catch((e) => setMsg({ text: err(e), tone: "bad" })); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data || mode !== "radius" || q.trim().length < 4 || q === place?.label) { setOpts([]); return; }
    const h = setTimeout(() => api<{ places: Place[] }>(`/api/places?q=${encodeURIComponent(q)}&country=${data.country}&lang=${lang}`, { auth: false }).then((j) => setOpts(j.places ?? [])).catch(() => setOpts([])), 350);
    return () => clearTimeout(h);
  }, [q, mode, data, place, lang]);

  async function save() {
    setBusy(true); setMsg(null);
    const feeCents = Math.round((Number(fee.replace(",", ".")) || 0) * 100);
    const zone = mode === "radius"
      ? { mode, label: place?.label ?? "", lat: place?.lat, lng: place?.lng, km: Number(km.replace(",", ".")), extended: wide ? { km: Number(wKm.replace(",", ".")), feeCents } : null }
      : { mode, codes, extended: wide ? { codes: wCodes, feeCents } : null };
    try { fill(await api<Data>("/api/pro/home-visits", { method: "PUT", body: { practitionerId: vetId, travelMin: travel, zone } }), vetId); setMsg({ text: t("saved"), tone: "ok" }); }
    catch (e) { setMsg({ text: err(e), tone: "bad" }); }
    setBusy(false);
  }
  async function setAuto(on: boolean) {
    try { fill(await api<Data>("/api/pro/home-visits", { method: "PUT", body: { autoConfirm: on } }), vetId); } catch (e) { setMsg({ text: err(e), tone: "bad" }); }
  }

  if (!data) return <View style={{ flex: 1, padding: 20 }}>{msg ? <Notice text={msg.text} tone="bad" /> : <Loading />}</View>;
  const v = data.vets.find((x) => x.id === vetId);
  return (
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      {!data.ready && <Notice text={t("hvDbOld")} tone="bad" />}
      {data.vets.length > 1 && <Card style={{ gap: 10 }}><Txt v="h3">{t("hvVet")}</Txt><Choice wrap options={data.vets.map((x) => ({ value: x.id, label: x.name }))} value={vetId} onChange={(id) => fill(data, id)} /></Card>}
      {v && !v.zone && <Notice text={t("hvNoZone")} />}
      <Card style={{ gap: 12 }}>
        <Txt v="h3">{t("hvArea")}</Txt>
        <Choice options={[{ value: "radius", label: t("hvRadius"), icon: "map-marker-radius-outline" }, { value: "postal", label: t("hvPostal"), icon: "mailbox-outline" }]} value={mode} onChange={setMode} />
        {mode === "radius" ? <>
          <Field label={t("hvStart")} value={q} onChangeText={(x) => { setQ(x); setPlace(null); }} autoCorrect={false} />
          {opts.map((o) => <Pressable key={`${o.lat},${o.lng}`} onPress={() => { setPlace(o); setQ(o.label); setOpts([]); }} style={{ paddingVertical: 8 }}><Txt v="body" color={C.blue}>{o.label}</Txt></Pressable>)}
          <Field label={t("hvKm")} value={km} onChangeText={setKm} keyboardType="decimal-pad" />
        </> : <Field label={t("hvCodes")} value={codes} onChangeText={setCodes} multiline autoCapitalize="characters" />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Switch value={wide} onValueChange={setWide} /><Txt v="body" style={{ flex: 1 }}>{t("hvWider")}</Txt></View>
        {wide && <>
          {mode === "radius" ? <Field label={t("hvWiderKm")} value={wKm} onChangeText={setWKm} keyboardType="decimal-pad" /> : <Field label={t("hvWiderCodes")} value={wCodes} onChangeText={setWCodes} autoCapitalize="characters" />}
          <Field label={`${t("hvFee")} (${data.currency})`} value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
        </>}
      </Card>
      <Card style={{ gap: 10 }}>
        <Txt v="h3">{t("hvTravel")}</Txt>
        <Choice wrap options={[...new Set([...TRAVEL, travel])].sort((a, b) => a - b).map((n) => ({ value: String(n), label: n ? `${n} min` : t("hvNone") }))} value={String(travel)} onChange={(x) => setTravel(Number(x))} />
      </Card>
      <PillButton label={t("save")} loading={busy} onPress={save} />
      {msg && <Notice text={msg.text} tone={msg.tone} />}
      <Card style={{ gap: 10 }}>
        <Txt v="h3">{t("hvConf")}</Txt>
        <Txt v="small">{t("hvConfRule")}</Txt>
        {v && <Pill tone={v.calendarConnected ? "ok" : "wait"} icon="calendar-sync-outline" label={t(v.calendarConnected ? "hvCalOn" : "hvCalOff")} />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Switch value={data.autoConfirm} onValueChange={setAuto} /><Txt v="body" style={{ flex: 1 }}>{t("hvAuto")}</Txt></View>
      </Card>
    </ScrollView>
  );
}
