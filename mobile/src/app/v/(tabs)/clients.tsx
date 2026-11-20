import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Backdrop } from "@/components/Backdrop";
import { ProGate } from "@/components/pro";
import { Header } from "@/components/Screen";
import { Avatar, Card, Empty, Icon, Loading, Notice, Row, Txt } from "@/components/ui";
import { SPECIES_ICON, apiMessage, callPhone, sendMail, typeKey } from "@/lib/actions";
import { api } from "@/lib/api";
import { money, plainDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { usePro } from "@/lib/pro";
import { C, F } from "@/lib/theme";
import type { Client } from "@/lib/types";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Everyone who booked with the clinic: pets, number and type of appointments, amount paid online; tap to call or write. */
export default function Clients() {
  const { t, lang } = useI18n(), insets = useSafeAreaInsets(), { practice, bookings } = usePro();
  const [list, setList] = useState<Client[] | null>(null), [err, setErr] = useState(""), [q, setQ] = useState(""), [open, setOpen] = useState(""), [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try { const r = await api<{ clients: Client[] }>("/api/pro/clients"); setList(r.clients); setErr(""); }
    catch (e) { setErr(apiMessage(e, t)); setList((cur) => cur ?? []); }
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const shown = useMemo(() => { const n = norm(q.trim()); return (list ?? []).filter((c) => !n || norm([c.name, c.phone, c.email, ...Object.keys(c.pets)].join(" ")).includes(n)); }, [list, q]);

  const ready = !!practice && !!bookings;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      <FlatList
        data={ready ? shown : []} keyExtractor={(c) => c.id} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 40, gap: 12, width: "100%", maxWidth: 600, alignSelf: "center" }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.blue} colors={[C.blue]} />}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <Header title={t("tabClients")} />
            {!ready ? <ProGate /> : <>
              <View style={st.search}>
                <Icon name="magnify" size={22} color={C.mute} />
                <TextInput value={q} onChangeText={setQ} placeholder={t("searchClients")} placeholderTextColor={C.mute} accessibilityLabel={t("searchClients")} autoCorrect={false} style={st.searchInput} />
              </View>
              {err ? <Notice tone="bad" text={err} /> : null}
              {list === null ? <Loading /> : shown.length === 0 ? <Empty icon="account-group-outline" text={t("noClients")} /> : null}
            </>}
          </View>}
        renderItem={({ item: c }) => {
          const on = open === c.id, spent = Object.entries(c.spent).map(([cur, cents]) => money(cents, cur, lang)).join(" + ");
          return (
            <Card style={{ gap: 10 }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: on }} accessibilityLabel={c.name} onPress={() => setOpen(on ? "" : c.id)} style={({ pressed }) => [{ flexDirection: "row", gap: 12, alignItems: "center" }, pressed ? { opacity: 0.8 } : null]}>
                <Avatar name={c.name || "?"} size={48} />
                <View style={{ flex: 1 }}>
                  <Txt v="h3" numberOfLines={1}>{c.name || "—"}</Txt>
                  <Txt v="small" numberOfLines={2}>{t("nVisits", { n: c.visits })} · {t("lastVisit")} {plainDate(c.last.slice(0, 10), lang)}</Txt>
                </View>
                <Icon name={on ? "chevron-up" : "chevron-down"} size={22} color={C.mute} />
              </Pressable>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(c.pets).map(([name, sp]) => <View key={name} style={st.tag}><Icon name={SPECIES_ICON[sp] ?? "paw"} size={14} color="#0E8F89" /><Text style={st.tagTxt}>{name}</Text></View>)}
                {spent ? <View style={[st.tag, { backgroundColor: C.tint }]}><Text style={[st.tagTxt, { color: C.blue }]}>{t("spent")}: {spent}</Text></View> : null}
              </View>
              {on && (
                <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 }}>
                  {c.phone ? <Row icon="phone-outline" label={t("phone")} value={c.phone} onPress={() => callPhone(c.phone)} /> : null}
                  {c.email ? <Row icon="email-outline" label={t("email")} value={c.email} onPress={() => sendMail(c.email)} /> : null}
                  <Txt v="small" style={{ marginTop: 4 }}>{Object.entries(c.types).map(([k, n]) => `${t(typeKey(k))}: ${n}`).join(" · ")}</Txt>
                </View>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 16, color: C.ink, paddingVertical: 10 },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#DDF8F4" },
  tagTxt: { fontFamily: F.semi, fontSize: 12.5, color: "#0E7F7A" },
});
