import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DeepPanel } from "@/components/Backdrop";
import { Logo, Screen, type ScrollRef } from "@/components/Screen";
import { Avatar, Card, Divider, Empty, Eyebrow, Glass, Headline, Icon, Loading, Notice, PillButton, Txt, type IconName } from "@/components/ui";
import type { CopyKey } from "@/copy";
import { TYPE_ICON, apiMessage, flag, typeKey } from "@/lib/actions";
import { api } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { C, F, T } from "@/lib/theme";
import type { PracticeCard } from "@/lib/types";

type Filter = "" | "video" | "home" | "clinic";
const STRIP: { value: Filter; icon: IconName; label: CopyKey }[] = [
  { value: "video", icon: "stethoscope", label: "stripVideo" },
  { value: "home", icon: "home-outline", label: "stripHome" },
  { value: "clinic", icon: "hospital-building", label: "stripClinic" },
  { value: "", icon: "paw-outline", label: "stripAll" },
];

/** Home of the owners' app: the Televet hero, the service strip (which filters the list) and the vets of the chosen country. */
export default function Home() {
  const { t, lang, country } = useI18n(), router = useRouter();
  const [type, setType] = useState<Filter>(""), [q, setQ] = useState(""), [query, setQuery] = useState("");
  const [list, setList] = useState<PracticeCard[] | null>(null), [err, setErr] = useState(""), [refreshing, setRefreshing] = useState(false);
  const scroll = useRef<ScrollRef>(null), listY = useRef(0);

  useEffect(() => { const id = setTimeout(() => setQuery(q.trim()), 400); return () => clearTimeout(id); }, [q]);
  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await api<{ practices: PracticeCard[] }>(`/api/app/practices?country=${country}&type=${type}&q=${encodeURIComponent(query)}`, { auth: false });
      setList(r.practices);
    } catch (e) { setList((cur) => cur ?? []); setErr(apiMessage(e, t)); }
  }, [country, type, query, t]);
  useEffect(() => { setList(null); load(); }, [load]);

  const toList = () => scroll.current?.scrollTo({ y: Math.max(0, listY.current - 12), animated: true });
  return (
    <Screen scrollRef={scroll} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <View style={st.top}>
        <Logo width={128} />
        <Pressable accessibilityRole="button" accessibilityLabel={t("country")} onPress={() => router.push("/o/profile")} style={({ pressed }) => [st.country, pressed ? { opacity: 0.7 } : null]}>
          <Text style={{ fontSize: 16 }}>{flag(country)}</Text><Text style={st.countryTxt}>{country}</Text><Icon name="chevron-down" size={16} color={C.blue} />
        </Pressable>
      </View>

      <DeepPanel ecg>
        <Image source={require("../../../../assets/photos/hero-pets.jpg")} style={st.heroPhoto} contentFit="cover" contentPosition="top" accessible={false} accessibilityIgnoresInvertColors />
        <View style={st.hero}>
          <Headline deep stack a={t("heroA")} b={t("heroB")} style={{ fontSize: 27, lineHeight: 33, maxWidth: 290 }} />
          <Txt v="small" color="#E3F1FF" style={{ maxWidth: 176, fontSize: 14, lineHeight: 20 }}>{t("heroSub")}</Txt>
          <PillButton kind="white" small arrow label={t("bookCta")} onPress={toList} style={{ alignSelf: "flex-start", marginTop: 4 }} />
        </View>
      </DeepPanel>

      <Glass style={st.strip}>
        {STRIP.map((s, i) => {
          const on = s.value === type;
          return (
            <View key={s.label} style={{ flex: 1, flexDirection: "row" }}>
              {i > 0 && <Divider vertical />}
              <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={t(s.label).replace("\n", " ")} onPress={() => { setType(s.value); toList(); }} style={({ pressed }) => [st.stripItem, pressed ? { opacity: 0.7 } : null]}>
                <Icon name={s.icon} size={26} color={on ? C.blue : "#2D5BE3"} />
                <Text style={[st.stripTxt, on ? { fontFamily: F.bold, color: C.blue } : null]}>{t(s.label)}</Text>
                <View style={[st.stripDot, on ? { backgroundColor: C.teal } : null]} />
              </Pressable>
            </View>
          );
        })}
      </Glass>

      <View onLayout={(e) => { listY.current = e.nativeEvent.layout.y; }} style={{ gap: 12, marginTop: 6 }}>
        <View><Eyebrow>{t("ourVets")}</Eyebrow><Txt v="h2">{t("vetsTitle")}</Txt></View>
        <View style={st.search}>
          <Icon name="magnify" size={22} color={C.mute} />
          <TextInput value={q} onChangeText={setQ} placeholder={t("searchPh")} placeholderTextColor={C.mute} accessibilityLabel={t("search")} returnKeyType="search" autoCorrect={false} style={st.searchInput} />
          {q.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel={t("close")} hitSlop={10} onPress={() => setQ("")}><Icon name="close-circle" size={20} color={C.mute} /></Pressable>}
        </View>
        {err ? <Notice tone="bad" text={err} /> : null}
        {list === null ? <Loading /> : list.length === 0 ? (
          err ? <PillButton kind="outline" label={t("retry")} onPress={load} /> : <Empty icon="map-search-outline" text={t(query || type ? "noVets" : "noVetsCountry")} />
        ) : list.map((p) => (
          <Card key={p.id} onPress={() => router.push({ pathname: "/o/practice/[id]", params: { id: p.id } })} accessibilityLabel={p.name} style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Avatar uri={p.logoUrl} name={p.name} />
              <View style={{ flex: 1 }}>
                <Txt v="h3" numberOfLines={2}>{p.name}</Txt>
                <Txt v="small" numberOfLines={1}>{[t((`k_${["clinic", "vet", "home"].includes(p.kind) ? p.kind : "vet"}`) as CopyKey), p.city].filter(Boolean).join(" · ")}</Txt>
              </View>
              <View style={st.go}><Icon name="arrow-right" size={20} color={C.white} /></View>
            </View>
            {p.headline ? <Txt v="body" color={C.soft} numberOfLines={2} style={{ fontSize: 15, lineHeight: 21 }}>{p.headline}</Txt> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {p.types.map((k) => <View key={k} style={st.tag}><Icon name={TYPE_ICON[k] ?? "stethoscope"} size={14} color={C.blue} /><Text style={st.tagTxt}>{t(typeKey(k))}</Text></View>)}
            </View>
            {p.nextSlot && <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><View style={st.dot} /><Text style={[T.small, { color: "#0E7F7A", flex: 1 }]} numberOfLines={1}>{t("nextSlot")}: {dateTime(p.nextSlot, lang, p.timezone)}</Text></View>}
          </Card>
        ))}
      </View>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Image source={require("../../../../assets/photos/sleeping-pets.jpg")} style={{ width: "100%", height: 170 }} contentFit="cover" accessible={false} accessibilityIgnoresInvertColors />
        <View style={{ padding: 18, gap: 8 }}>
          <Headline size="h2" a={t("teleA")} b={t("teleB")} />
          <Txt v="body" color={C.soft} style={{ fontSize: 15, lineHeight: 21 }}>{t("teleSub")}</Txt>
          <PillButton kind="outline" small arrow label={t("discover")} onPress={() => { setType("video"); toList(); }} style={{ alignSelf: "flex-start", marginTop: 4 }} />
        </View>
      </Card>

      <DeepPanel>
        <View style={{ padding: 22, gap: 14 }}>
          <Icon name="paw" size={92} color="rgba(255,255,255,0.12)" style={{ position: "absolute", right: 14, bottom: 6 }} />
          <Txt v="h2" color={C.white} style={{ maxWidth: 250 }}>{t("bandTitle")}</Txt>
          <PillButton kind="white" arrow label={t("bookCta")} onPress={toList} style={{ alignSelf: "flex-start" }} />
        </View>
      </DeepPanel>
    </Screen>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 40 },
  country: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, minHeight: 38, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.85)", borderWidth: 1, borderColor: "#D5E3FA" },
  countryTxt: { fontFamily: F.bold, fontSize: 13.5, color: C.blue },
  hero: { padding: 22, paddingBottom: 62, gap: 12, minHeight: 330 },
  heroPhoto: { position: "absolute", right: 0, bottom: 0, width: 150, height: 196, borderTopLeftRadius: 96 },
  strip: { flexDirection: "row", marginTop: -46, marginHorizontal: 10, paddingVertical: 12, paddingHorizontal: 4 },
  stripItem: { flex: 1, alignItems: "center", gap: 5, paddingHorizontal: 2, minHeight: 78, justifyContent: "center" },
  stripTxt: { fontFamily: F.semi, fontSize: 11.5, lineHeight: 14.5, color: "#1B3FB8", textAlign: "center" },
  stripDot: { width: 18, height: 3, borderRadius: 2, backgroundColor: "transparent" },
  search: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 16, color: C.ink, paddingVertical: 10 },
  go: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.tint },
  tagTxt: { fontFamily: F.semi, fontSize: 12.5, color: C.blue },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.teal },
});
