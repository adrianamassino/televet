import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Confirm } from "@/components/Confirm";
import { Header, Screen } from "@/components/Screen";
import { Settings } from "@/components/Settings";
import { Avatar, Card, Field, Notice, PillButton, Txt } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { apiMessage } from "@/lib/actions";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { sb } from "@/lib/supabase";
import { C } from "@/lib/theme";

/** The owner's account: name and phone, notifications, language and country, legal pages, sign-out and account deletion. */
export default function Profile() {
  const { t, lang, country } = useI18n(), { session, ready, signOut } = useSession(), router = useRouter();
  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "info" } | null>(null);
  const [askDelete, setAskDelete] = useState(false), [deleting, setDeleting] = useState(false);

  const uid = session?.user.id;
  useFocusEffect(useCallback(() => {
    if (!uid) { setLoaded(false); return; }
    sb().from("owners").select("full_name, phone").eq("id", uid).maybeSingle().then(({ data }) => {
      setName(data?.full_name || ((session?.user.user_metadata?.full_name as string | undefined) ?? "")); setPhone(data?.phone ?? ""); setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]));

  async function save() {
    if (!uid) return;
    setBusy(true); setMsg(null);
    const { error } = await sb().from("owners").upsert({ id: uid, full_name: name.trim(), phone: phone.trim() || null, country, language: lang }, { onConflict: "id" });
    setBusy(false); setMsg(error ? { text: t("genericErr"), tone: "bad" } : { text: t("saved"), tone: "ok" });
  }
  async function deleteAccount() {
    setDeleting(true);
    try {
      await api("/api/app/account", { method: "DELETE" });
      setAskDelete(false); await signOut(); setMsg({ text: t("deleted"), tone: "ok" });
    } catch (e) {
      setAskDelete(false);
      const code = e instanceof ApiError ? e.code : "";
      setMsg({ text: code === "upcoming_bookings" ? t("deleteUpcoming") : code === "practice_account" ? t("deletePro") : apiMessage(e, t), tone: code ? "info" : "bad" });
    } finally { setDeleting(false); }
  }

  return (
    <Screen>
      <Header title={t("tabProfile")} />
      {msg && <Notice text={msg.text} tone={msg.tone} />}
      {ready && !session ? (
        <Card style={{ gap: 12 }}>
          <Txt v="body" color={C.soft}>{t("signInProfile")}</Txt>
          <PillButton label={t("signIn")} arrow onPress={() => router.push({ pathname: "/login", params: { back: "1" } })} />
        </Card>
      ) : session ? (
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <Avatar name={name || session.user.email || "?"} size={58} />
            <View style={{ flex: 1 }}><Txt v="h3" numberOfLines={1}>{name || t("account")}</Txt><Txt v="small" numberOfLines={1}>{session.user.email}</Txt></View>
          </View>
          <Field label={t("yourName")} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" editable={loaded} maxLength={80} />
          <Field label={t("phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" editable={loaded} maxLength={30} />
          <PillButton kind="outline" label={t("save")} loading={busy} disabled={!loaded} onPress={save} />
        </Card>
      ) : null}

      <Settings />

      {session && <>
        <PillButton kind="outline" icon="logout" label={t("signOut")} onPress={() => { signOut(); setMsg(null); }} />
        <PillButton kind="quietDanger" small label={t("deleteAccount")} onPress={() => setAskDelete(true)} />
      </>}
      <Confirm visible={askDelete} danger busy={deleting} title={t("deleteAccount")} text={t("deleteAsk")} confirmLabel={t("deleteConfirm")} cancelLabel={t("cancel")} onConfirm={deleteAccount} onCancel={() => setAskDelete(false)} />
    </Screen>
  );
}
