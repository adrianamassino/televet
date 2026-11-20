import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BookletReader, type BookletReaderHandle } from "@/components/BookletReader";
import { Confirm } from "@/components/Confirm";
import { Screen } from "@/components/Screen";
import { Card, Choice, DateField, Empty, Eyebrow, Field, Icon, IconButton, IconTile, Loading, Notice, Pill, PillButton, Txt } from "@/components/ui";
import type { CopyKey } from "@/copy";
import { SPECIES_ICON, apiMessage, openWeb, speciesKey } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { base64ToBytes, daysUntil, parseDayMonthYear, plainDate, toDayMonthYear, todayYmd } from "@/lib/format";
import { plusOneYear, sameEntry, sanitizeProposals } from "@/lib/health";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { errText, sb } from "@/lib/supabase";
import { C, F } from "@/lib/theme";
import { RECORD_KINDS, type HealthRecord, type Pet, type PetDoc, type Proposal, type RecordKind } from "@/lib/types";

type Row = { key: string; include: boolean; documentId: string; kind: RecordKind; name: string; done: string; due: string };
const kindKey = (k: string) => (`rk_${k}`) as CopyKey;
const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Digital health record of one pet: photos of the paper booklet (private), the entries read from them
 * (checked by the owner before saving), the history by type and the next due dates, which trigger reminders.
 */
export default function PetHealth() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n(), { session } = useSession(), router = useRouter();
  const uid = session?.user.id;
  const reader = useRef<BookletReaderHandle>(null);

  const [pet, setPet] = useState<Pet | null | undefined>(undefined), [recs, setRecs] = useState<HealthRecord[]>([]), [docs, setDocs] = useState<PetDoc[]>([]);
  const [rows, setRows] = useState<Row[]>([]), [lastDocs, setLastDocs] = useState<string[]>([]), [useReader, setUseReader] = useState(false);
  const [busy, setBusy] = useState(""), [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "info" } | null>(null);
  const [adding, setAdding] = useState(false), [form, setForm] = useState({ kind: "vaccine" as RecordKind, name: "", done: "", due: "", vet: "" });
  const [ask, setAsk] = useState<{ kind: "rec" | "doc" | "pet"; rec?: HealthRecord; doc?: PetDoc } | null>(null), [working, setWorking] = useState(false);
  const today = todayYmd();

  const load = useCallback(async () => {
    if (!uid) return;
    const [p, r, d] = await Promise.all([
      sb().from("pets").select("id, name, species").eq("id", petId).maybeSingle(),
      sb().from("pet_health_records").select("id, kind, name, done_on, next_due, vet_name, document_id").eq("pet_id", petId).order("done_on", { ascending: false, nullsFirst: false }),
      sb().from("pet_documents").select("id, storage_path, created_at").eq("pet_id", petId).order("created_at", { ascending: false }),
    ]);
    setPet((p.data as Pet | null) ?? null); setRecs((r.data ?? []) as HealthRecord[]);
    const list = (d.data ?? []) as PetDoc[];
    if (list.length) {
      const { data: urls } = await sb().storage.from("pet-docs").createSignedUrls(list.map((x) => x.storage_path), 3600);
      list.forEach((x, i) => { x.url = urls?.[i]?.signedUrl ?? undefined; });
    }
    setDocs(list);
  }, [uid, petId]);
  useEffect(() => { load(); }, [load]);

  /** Shrinks a phone photo (often 8–12 MB) to at most 1800 px, saves it in the owner's private folder and returns its id + data for the reader. */
  async function store(asset: ImagePicker.ImagePickerAsset): Promise<{ id: string; base64: string }> {
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > 1800) ctx.resize(asset.width >= asset.height ? { width: 1800 } : { height: 1800 });
    const out = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.82, base64: true });
    if (!out.base64) throw new Error("no image data");
    const path = `${uid}/${petId}/${uniq()}.jpg`;
    const up = await sb().storage.from("pet-docs").upload(path, base64ToBytes(out.base64).buffer as ArrayBuffer, { contentType: "image/jpeg" });
    if (up.error) throw up.error;
    const { data: doc, error } = await sb().from("pet_documents").insert({ pet_id: petId, owner_id: uid, kind: "booklet", storage_path: path }).select("id").single();
    if (error) throw error;
    return { id: doc.id as string, base64: out.base64 };
  }

  const propose = (list: Proposal[], documentId: string, known: { kind: string; name: string; done_on: string | null }[]): Row[] =>
    list.filter((p) => !known.some((k) => sameEntry(k, p))).map((p) => ({ key: uniq(), include: true, documentId, kind: p.kind, name: p.name, done: toDayMonthYear(p.done_on), due: toDayMonthYear(p.next_due) }));

  async function addPhotos(from: "camera" | "library") {
    if (!uid) return;
    setMsg(null);
    try {
      if (from === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { setMsg({ text: t("hNoCamera"), tone: "info" }); return; }
      }
      const res = from === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 8, quality: 0.9 });
      if (res.canceled || !res.assets.length) return;
      setUseReader(true);
      const found: Row[] = [], ids: string[] = [];
      let unreadable = 0;
      for (let i = 0; i < res.assets.length; i++) {
        const n = res.assets.length > 1 ? ` (${i + 1}/${res.assets.length})` : "";
        setBusy(t("hUploading") + n);
        const saved = await store(res.assets[i]);
        ids.push(saved.id);
        setBusy(t(docs.length + i === 0 ? "hReadingFirst" : "hReading") + n);
        const proposals = reader.current ? await reader.current.read(saved.base64, lang) : null;
        if (!proposals || proposals.length === 0) unreadable++;
        else found.push(...propose(proposals, saved.id, [...recs, ...found.map((f) => ({ kind: f.kind, name: f.name, done_on: parseDayMonthYear(f.done) }))]));
      }
      setLastDocs(ids); setRows((cur) => [...cur, ...found]);
      setMsg(found.length ? null : { text: unreadable ? t("hNone") : t("hPhotoSaved"), tone: "info" });
      await load();
    } catch (e) { setMsg({ text: `${t("genericErr")} (${errText(e)})`, tone: "bad" }); }
    finally { setBusy(""); }
  }

  /** Optional: sends the last photos to the external AI reader (handwriting). Only when the person asks for it. */
  async function aiReread() {
    if (!lastDocs.length) return;
    setMsg(null);
    const found: Row[] = [];
    try {
      for (let i = 0; i < lastDocs.length; i++) {
        setBusy(`${t("hReading")}${lastDocs.length > 1 ? ` (${i + 1}/${lastDocs.length})` : ""}`);
        const r = await api<{ proposals: unknown }>(`/api/owner/pets/${petId}/scan`, { body: { documentId: lastDocs[i] } });
        found.push(...propose(sanitizeProposals(r.proposals), lastDocs[i], [...recs, ...rows.map((f) => ({ kind: f.kind, name: f.name, done_on: parseDayMonthYear(f.done) })), ...found.map((f) => ({ kind: f.kind, name: f.name, done_on: parseDayMonthYear(f.done) }))]));
      }
      setRows((cur) => [...cur, ...found]);
      if (!found.length) setMsg({ text: t("hNone"), tone: "info" });
    } catch (e) { setMsg({ text: e instanceof ApiError && e.status === 503 ? t("hAiOff") : apiMessage(e, t), tone: e instanceof ApiError && e.status === 503 ? "info" : "bad" }); }
    finally { setBusy(""); }
  }

  const badDate = (s: string) => s.trim() !== "" && !parseDayMonthYear(s);
  async function saveRows() {
    const chosen = rows.filter((r) => r.include && r.name.trim());
    if (!uid || !chosen.length) return;
    if (chosen.some((r) => badDate(r.done) || badDate(r.due))) { setMsg({ text: t("hBadDate"), tone: "bad" }); return; }
    setWorking(true);
    const { error } = await sb().from("pet_health_records").insert(chosen.map((r) => ({ pet_id: petId, owner_id: uid, document_id: r.documentId, kind: r.kind, name: r.name.trim(), done_on: parseDayMonthYear(r.done), next_due: parseDayMonthYear(r.due), source: "scan" })));
    setWorking(false);
    if (error) { setMsg({ text: t("genericErr"), tone: "bad" }); return; }
    setRows([]); setMsg({ text: t("saved"), tone: "ok" }); load();
  }
  async function addManual() {
    if (!uid || !form.name.trim()) return;
    if (badDate(form.done) || badDate(form.due)) { setMsg({ text: t("hBadDate"), tone: "bad" }); return; }
    setWorking(true);
    const { error } = await sb().from("pet_health_records").insert({ pet_id: petId, owner_id: uid, kind: form.kind, name: form.name.trim(), done_on: parseDayMonthYear(form.done), next_due: parseDayMonthYear(form.due), vet_name: form.vet.trim() || null, source: "manual" });
    setWorking(false);
    if (error) { setMsg({ text: t("genericErr"), tone: "bad" }); return; }
    setForm({ ...form, name: "", done: "", due: "", vet: "" }); setAdding(false); setMsg({ text: t("saved"), tone: "ok" }); load();
  }
  async function remindInOneYear(r: HealthRecord) {
    if (!r.done_on) return;
    await sb().from("pet_health_records").update({ next_due: plusOneYear(r.done_on), remind_30_at: null, remind_7_at: null, remind_0_at: null }).eq("id", r.id);
    load();
  }
  async function confirmAsk() {
    if (!ask) return;
    setWorking(true);
    try {
      if (ask.kind === "rec" && ask.rec) await sb().from("pet_health_records").delete().eq("id", ask.rec.id);
      if (ask.kind === "doc" && ask.doc) { await sb().storage.from("pet-docs").remove([ask.doc.storage_path]); await sb().from("pet_documents").delete().eq("id", ask.doc.id); }
      if (ask.kind === "pet") {
        // a pet that has appointments stays (the vet's history refers to it)
        const { count } = await sb().from("bookings").select("id", { count: "exact", head: true }).eq("pet_id", petId);
        if ((count ?? 0) > 0) { setAsk(null); setMsg({ text: t("hPetHasBookings"), tone: "info" }); return; }
        if (docs.length) await sb().storage.from("pet-docs").remove(docs.map((d) => d.storage_path));
        const { error } = await sb().from("pets").delete().eq("id", petId);
        if (error) { setAsk(null); setMsg({ text: t("hPetHasBookings"), tone: "info" }); return; }
        setAsk(null); router.back(); return;
      }
      setAsk(null); await load();
    } finally { setWorking(false); }
  }
  const setRow = (key: string, patch: Partial<Row>) => setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  if (!uid) return <Screen top={false}><Empty icon="notebook-heart-outline" text={t("signInPets")} action={<PillButton label={t("signIn")} arrow onPress={() => router.push({ pathname: "/login", params: { back: "1" } })} />} /></Screen>;
  if (pet === undefined) return <Screen top={false}><Loading /></Screen>;
  if (pet === null) return <Screen top={false}><Empty icon="paw-off-outline" text={t("notFound")} action={<PillButton kind="outline" label={t("back")} onPress={() => router.back()} />} /></Screen>;

  const due = (ymd: string) => { const d = daysUntil(ymd, today); return { label: d < 0 ? t("hOverdue") : d === 0 ? t("hToday") : t("hInDays", { n: d }), tone: (d < 0 ? "bad" : d <= 30 ? "wait" : "ok") as "bad" | "wait" | "ok" }; };
  const upcoming = recs.filter((r) => r.next_due).sort((a, b) => a.next_due!.localeCompare(b.next_due!));
  const groups = RECORD_KINDS.map((k) => ({ k, items: recs.filter((r) => r.kind === k) })).filter((g) => g.items.length);
  const kindOptions = RECORD_KINDS.map((k) => ({ value: k, label: t(kindKey(k)) }));

  return (
    <Screen top={false}>
      <Stack.Screen options={{ title: pet.name }} />
      {useReader && <BookletReader ref={reader} />}
      <Card style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <IconTile name={SPECIES_ICON[pet.species] ?? "paw"} size={56} tone="teal" />
        <View style={{ flex: 1 }}><Txt v="h2">{pet.name}</Txt><Txt v="small">{t(speciesKey(pet.species))} · {t("healthRecord")}</Txt></View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><IconTile name="camera-outline" tone="deep" /><Txt v="h3" style={{ flex: 1 }}>{t("hScanH")}</Txt></View>
        <Txt v="body" color={C.soft} style={{ fontSize: 15, lineHeight: 21 }}>{t("hScanP")}</Txt>
        <PillButton icon="camera-outline" label={t("hTake")} disabled={!!busy} onPress={() => addPhotos("camera")} />
        <PillButton kind="outline" icon="image-multiple-outline" label={t("hPick")} disabled={!!busy} onPress={() => addPhotos("library")} />
        {busy ? <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><ActivityIndicator color={C.blue} /><Txt v="small" style={{ flex: 1 }}>{busy}</Txt></View> : null}
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}><Icon name="lock-outline" size={15} color={C.mute} /><Txt v="tiny" style={{ flex: 1 }}>{t("hPrivate")}</Txt></View>

        {rows.length > 0 && (
          <View style={{ gap: 12, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 14 }}>
            <Notice text={t("hCheck")} />
            {rows.map((r) => (
              <View key={r.key} style={[st.review, r.include ? null : { opacity: 0.5 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: r.include }} accessibilityLabel={r.name} hitSlop={8} onPress={() => setRow(r.key, { include: !r.include })}>
                    <Icon name={r.include ? "checkbox-marked" : "checkbox-blank-outline"} size={26} color={r.include ? C.blue : C.mute} />
                  </Pressable>
                  <View style={{ flex: 1 }}><Field value={r.name} onChangeText={(x) => setRow(r.key, { name: x })} accessibilityLabel={t("hName")} maxLength={120} /></View>
                </View>
                <Choice wrap value={r.kind} onChange={(k) => setRow(r.key, { kind: k })} options={kindOptions} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}><DateField label={t("hDoneOn")} value={r.done} onChange={(x) => setRow(r.key, { done: x })} placeholder={t("hDatePh")} error={badDate(r.done) ? " " : undefined} /></View>
                  <View style={{ flex: 1 }}><DateField label={t("hNextDue")} value={r.due} onChange={(x) => setRow(r.key, { due: x })} placeholder={t("hDatePh")} error={badDate(r.due) ? " " : undefined} /></View>
                </View>
              </View>
            ))}
            <PillButton label={t("hSaveSel")} loading={working} disabled={!rows.some((r) => r.include && r.name.trim())} onPress={saveRows} />
          </View>
        )}
        {!busy && lastDocs.length > 0 && (
          <View style={{ gap: 4 }}>
            <PillButton kind="quiet" small icon="auto-fix" label={t("hAi")} onPress={aiReread} style={{ alignSelf: "flex-start" }} />
            <Txt v="tiny">{t("hAiNote")}</Txt>
          </View>
        )}
        {msg && <Notice text={msg.text} tone={msg.tone} />}
      </Card>

      <View style={{ gap: 10 }}>
        <View><Eyebrow>{t("hUpcoming")}</Eyebrow><Txt v="small">{t("hUpNote")}</Txt></View>
        {upcoming.length === 0 ? <Txt v="body" color={C.soft}>{t("hNoUp")}</Txt> : upcoming.map((r) => {
          const u = due(r.next_due!);
          return (
            <Card key={r.id} style={st.line}>
              <View style={{ flex: 1 }}><Txt v="strong">{r.name}</Txt><Txt v="small">{t(kindKey(r.kind))} · {plainDate(r.next_due!, lang)}</Txt></View>
              <Pill tone={u.tone} label={u.label} />
            </Card>
          );
        })}
        <PillButton kind="outline" small arrow label={t("bookCta")} onPress={() => router.push("/o")} style={{ alignSelf: "flex-start" }} />
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow>{t("hHistory")}</Eyebrow>
        {groups.length === 0 ? <Txt v="body" color={C.soft}>{t("hNoHist")}</Txt> : groups.map((g) => (
          <View key={g.k} style={{ gap: 8 }}>
            <Txt v="h3">{t(kindKey(g.k))}</Txt>
            {g.items.map((r) => (
              <Card key={r.id} style={{ gap: 8 }}>
                <View style={st.lineInner}>
                  <View style={{ flex: 1 }}><Txt v="strong">{r.name}</Txt><Txt v="small">{[r.done_on ? plainDate(r.done_on, lang) : null, r.vet_name].filter(Boolean).join(" · ") || "—"}</Txt></View>
                  <IconButton name="trash-can-outline" tone="plain" size={36} label={`${t("del")}: ${r.name}`} onPress={() => setAsk({ kind: "rec", rec: r })} />
                </View>
                {r.next_due ? <Pill tone={due(r.next_due).tone} icon="bell-outline" label={`${t("hNextDue")}: ${plainDate(r.next_due, lang)}`} />
                  : r.done_on && (r.kind === "vaccine" || r.kind === "antiparasitic") ? <PillButton kind="quiet" small icon="bell-plus-outline" label={t("hPlus1y")} onPress={() => remindInOneYear(r)} style={{ alignSelf: "flex-start", marginVertical: -6 }} /> : null}
              </Card>
            ))}
          </View>
        ))}
        {adding ? (
          <Card style={{ gap: 12 }}>
            <Txt v="h3">{t("hAdd")}</Txt>
            <Choice wrap value={form.kind} onChange={(k) => setForm({ ...form, kind: k })} options={kindOptions} />
            <Field label={t("hName")} value={form.name} onChangeText={(x) => setForm({ ...form, name: x })} maxLength={120} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><DateField label={t("hDoneOn")} value={form.done} onChange={(x) => setForm({ ...form, done: x })} placeholder={t("hDatePh")} error={badDate(form.done) ? " " : undefined} /></View>
              <View style={{ flex: 1 }}><DateField label={t("hNextDue")} value={form.due} onChange={(x) => setForm({ ...form, due: x })} placeholder={t("hDatePh")} error={badDate(form.due) ? " " : undefined} /></View>
            </View>
            <Field label={t("hVet")} value={form.vet} onChangeText={(x) => setForm({ ...form, vet: x })} maxLength={80} />
            <PillButton label={t("add")} loading={working} disabled={!form.name.trim()} onPress={addManual} />
            <PillButton kind="quiet" small label={t("cancel")} onPress={() => setAdding(false)} />
          </Card>
        ) : <PillButton kind="outline" icon="plus" label={t("hAdd")} onPress={() => setAdding(true)} />}
      </View>

      <View style={{ gap: 10 }}>
        <Eyebrow>{t("hPhotos")}</Eyebrow>
        {docs.length === 0 ? <Txt v="body" color={C.soft}>{t("hNoPhotos")}</Txt> : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {docs.map((d) => (
              <View key={d.id} style={st.photo}>
                <Pressable accessibilityRole="imagebutton" accessibilityLabel={t("hPhotos")} onPress={() => d.url && openWeb(d.url)}>
                  <Image source={d.url ? { uri: d.url } : undefined} style={{ width: "100%", aspectRatio: 3 / 4, backgroundColor: C.tint }} contentFit="cover" />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={t("del")} hitSlop={6} onPress={() => setAsk({ kind: "doc", doc: d })} style={st.photoDel}><Icon name="trash-can-outline" size={18} color={C.danger} /></Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <Txt v="tiny" center style={{ marginTop: 6 }}>{t("hDisclaimer")}</Txt>
      <PillButton kind="quietDanger" small label={`${t("del")} ${pet.name}`} onPress={() => setAsk({ kind: "pet" })} />

      <Confirm visible={!!ask} danger busy={working} cancelLabel={t("cancel")} confirmLabel={t("del")} onCancel={() => setAsk(null)} onConfirm={confirmAsk}
        title={t("del")} text={ask?.kind === "rec" ? t("hAskDel") : ask?.kind === "doc" ? t("hAskDelDoc") : t("hAskDelPet", { name: pet.name })} />
    </Screen>
  );
}

const st = StyleSheet.create({
  review: { gap: 10, padding: 12, borderRadius: 18, backgroundColor: "#F5F9FF", borderWidth: 1, borderColor: C.line },
  line: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  lineInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  photo: { width: "31%", minWidth: 96, borderRadius: 16, overflow: "hidden", backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  photoDel: { position: "absolute", top: 6, right: 6, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
});
