import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Header, Screen } from "@/components/Screen";
import { Card, Choice, Field, Icon, IconTile, Loading, Notice, Pill, PillButton, Txt } from "@/components/ui";
import { SPECIES, SPECIES_ICON, speciesKey } from "@/lib/actions";
import { daysUntil, plainDate, todayYmd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { sb } from "@/lib/supabase";
import { C } from "@/lib/theme";
import type { Pet } from "@/lib/types";

type Due = { pet_id: string; name: string; next_due: string };

/** The owner's pets, each with its digital health record and the next due date (vaccine, treatment…). */
export default function Pets() {
  const { t, lang, country } = useI18n(), { session, ready } = useSession(), router = useRouter();
  const [pets, setPets] = useState<Pet[] | null>(null), [due, setDue] = useState<Record<string, Due>>({});
  const [adding, setAdding] = useState(false), [name, setName] = useState(""), [species, setSpecies] = useState<string>("dog");
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [refreshing, setRefreshing] = useState(false);

  const uid = session?.user.id;
  const load = useCallback(async () => {
    if (!uid) { setPets(null); return; }
    setErr("");
    const [p, d] = await Promise.all([
      sb().from("pets").select("id, name, species").order("created_at"),
      sb().from("pet_health_records").select("pet_id, name, next_due").not("next_due", "is", null).gte("next_due", todayYmd()).order("next_due").limit(300),
    ]);
    if (p.error) { setErr(t("netErr")); setPets((cur) => cur ?? []); return; }
    setPets((p.data ?? []) as Pet[]);
    const first: Record<string, Due> = {};
    for (const r of (d.data ?? []) as Due[]) if (!first[r.pet_id]) first[r.pet_id] = r; // the list is sorted: the first one per pet is the nearest
    setDue(first);
  }, [uid, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!uid || !name.trim()) return;
    setBusy(true); setErr("");
    await sb().from("owners").upsert({ id: uid, full_name: (session?.user.user_metadata?.full_name as string | undefined) ?? "", country, language: lang }, { onConflict: "id", ignoreDuplicates: true });
    const { error } = await sb().from("pets").insert({ owner_id: uid, name: name.trim(), species });
    setBusy(false);
    if (error) { setErr(t("genericErr")); return; }
    setName(""); setAdding(false); load();
  }

  if (ready && !session) return (
    <Screen><Header title={t("myPets")} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Image source={require("../../../../assets/photos/sleeping-pets.jpg")} style={{ width: "100%", height: 180 }} contentFit="cover" accessible={false} />
        <View style={{ padding: 18, gap: 12 }}>
          <Txt v="body" color={C.soft}>{t("signInPets")}</Txt>
          <PillButton label={t("signIn")} arrow onPress={() => router.push({ pathname: "/login", params: { back: "1" } })} />
        </View>
      </Card>
    </Screen>
  );

  const today = todayYmd();
  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Header title={t("myPets")} />
      {err ? <Notice tone="bad" text={err} /> : null}
      {pets === null ? <Loading /> : pets.length === 0 && !adding ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Image source={require("../../../../assets/photos/sleeping-pets.jpg")} style={{ width: "100%", height: 180 }} contentFit="cover" accessible={false} />
          <View style={{ padding: 18 }}><Txt v="body" color={C.soft}>{t("noPets")}</Txt></View>
        </Card>
      ) : pets.map((p) => {
        const d = due[p.id], n = d ? daysUntil(d.next_due, today) : 0;
        return (
          <Card key={p.id} accessibilityLabel={`${p.name}, ${t("healthRecord")}`} onPress={() => router.push({ pathname: "/o/pet/[id]", params: { id: p.id } })} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <IconTile name={SPECIES_ICON[p.species] ?? "paw"} size={54} tone="teal" />
              <View style={{ flex: 1 }}><Txt v="h2">{p.name}</Txt><Txt v="small">{t(speciesKey(p.species))}</Txt></View>
              <Icon name="chevron-right" size={26} color={C.mute} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Pill icon="notebook-heart-outline" label={t("healthRecord")} />
              {d && <Pill tone={n <= 30 ? "wait" : "ok"} icon="bell-outline" label={`${d.name} · ${plainDate(d.next_due, lang)}`} />}
            </View>
          </Card>
        );
      })}
      {pets !== null && (adding ? (
        <Card style={{ gap: 12 }}>
          <Txt v="h3">{t("addPet")}</Txt>
          <Field label={t("petName")} value={name} onChangeText={setName} autoCapitalize="words" maxLength={40} />
          <Choice wrap value={species} onChange={setSpecies} options={SPECIES.map((s) => ({ value: s as string, label: t(speciesKey(s)) }))} />
          <PillButton label={t("add")} loading={busy} disabled={!name.trim()} onPress={add} />
          <PillButton kind="quiet" small label={t("cancel")} onPress={() => setAdding(false)} />
        </Card>
      ) : <PillButton kind="outline" icon="plus" label={t("addPet")} onPress={() => setAdding(true)} />)}
    </Screen>
  );
}
