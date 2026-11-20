import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { DeepPanel } from "@/components/Backdrop";
import { Logo } from "@/components/Screen";
import { Field, Headline, Notice, PillButton, Txt } from "@/components/ui";
import { siteLang } from "@/copy";
import { API_URL, IS_VET } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { sb } from "@/lib/supabase";
import { C, F, shadow } from "@/lib/theme";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Sign-in (both apps) and account creation (owners). Vets create their account on the website, where the clinic profile is set up. */
export default function Login() {
  const { t, lang, country } = useI18n();
  const router = useRouter(), insets = useSafeAreaInsets();
  const { back } = useLocalSearchParams<{ back?: string }>();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<{ text: string; tone: "bad" | "ok" | "info" } | null>(null);

  const leave = () => { if (back && router.canGoBack()) router.back(); else router.replace("/"); };

  async function ensureOwner(userId: string, fullName: string) {
    if (IS_VET) return;
    await sb().from("owners").upsert({ id: userId, full_name: fullName, country, language: lang }, { onConflict: "id", ignoreDuplicates: true });
  }

  async function submit() {
    const mail = email.trim().toLowerCase();
    if (!EMAIL.test(mail) || !pass) return;
    setBusy(true); setMsg(null);
    try {
      if (mode === "in") {
        const { data, error } = await sb().auth.signInWithPassword({ email: mail, password: pass });
        if (error) { setMsg({ text: /confirm/i.test(error.message) ? t("emailNotConfirmed") : /invalid/i.test(error.message) ? t("badLogin") : t("netErr"), tone: "bad" }); return; }
        if (data.user) await ensureOwner(data.user.id, (data.user.user_metadata?.full_name as string | undefined) ?? "");
        leave();
      } else {
        if (pass.length < 8) { setMsg({ text: t("passHint"), tone: "bad" }); return; }
        const { data, error } = await sb().auth.signUp({ email: mail, password: pass, options: { data: { full_name: name.trim() }, emailRedirectTo: `${API_URL}/auth/callback` } });
        if (error) { setMsg({ text: /registered|exists/i.test(error.message) ? t("emailTaken") : /password/i.test(error.message) ? t("passHint") : t("netErr"), tone: "bad" }); return; }
        if (data.session && data.user) { await ensureOwner(data.user.id, name.trim()); leave(); return; }
        // no session: either the e-mail must be confirmed first, or the address already has an account (Supabase answers with an empty identity list)
        if (data.user && (data.user.identities?.length ?? 0) === 0) { setMode("in"); setMsg({ text: t("emailTaken"), tone: "info" }); return; }
        setMode("in"); setPass(""); setMsg({ text: t("checkMail"), tone: "ok" });
      }
    } catch { setMsg({ text: t("netErr"), tone: "bad" }); }
    finally { setBusy(false); }
  }

  async function forgot() {
    const mail = email.trim().toLowerCase();
    if (!EMAIL.test(mail)) { setMsg({ text: t("forgotNeedEmail"), tone: "info" }); return; }
    setBusy(true);
    await sb().auth.resetPasswordForEmail(mail, { redirectTo: `${API_URL}/auth/reset?lang=${lang}` }).catch(() => {});
    setBusy(false); setMsg({ text: t("forgotSent"), tone: "ok" });
  }

  const ok = EMAIL.test(email.trim()) && pass.length > 0 && (mode === "in" || name.trim().length > 1);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <DeepPanel flat radius={0} style={{ paddingBottom: 26 }}>
            <Image source={require("../../assets/photos/hero-pets.jpg")} style={st.photo} contentFit="cover" contentPosition="top" accessibilityIgnoresInvertColors accessible={false} />
            <View style={[st.hero, { paddingTop: insets.top + 18 }]}>
              <Logo tone="white" width={138} />
              <Headline deep stack a={t(IS_VET ? "proHeroA" : "heroA")} b={t(IS_VET ? "proHeroB" : "heroB")} style={{ marginTop: 22, maxWidth: 240, fontSize: 28, lineHeight: 34 }} />
              <Txt v="body" color="#E3F1FF" style={{ marginTop: 10, maxWidth: 196, fontSize: 14.5, lineHeight: 20.5 }}>{t(IS_VET ? "proHeroSub" : "heroSub")}</Txt>
            </View>
          </DeepPanel>

          <View style={[st.sheet, shadow("lift"), { paddingBottom: insets.bottom + 24 }]}>
            <View style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: 14 }}>
              <Txt v="h2">{t(mode === "in" ? "signIn" : "signUp")}</Txt>
              {mode === "up" && <Field label={t("yourName")} value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="next" />}
              <Field label={t("email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
              <Field label={t("password")} hint={mode === "up" ? t("passHint") : undefined} value={pass} onChangeText={setPass} secureTextEntry autoCapitalize="none" autoComplete={mode === "up" ? "new-password" : "current-password"} textContentType={mode === "up" ? "newPassword" : "password"} returnKeyType="go" onSubmitEditing={submit} />
              {msg && <Notice text={msg.text} tone={msg.tone} />}
              <PillButton label={t(mode === "in" ? "signIn" : "signUp")} arrow loading={busy} disabled={!ok} onPress={submit} />
              {mode === "in" && <Link label={t("forgot")} onPress={forgot} />}
              {IS_VET ? (
                <View style={{ alignItems: "center", gap: 2, marginTop: 6 }}>
                  <Txt v="small" center>{t("proNoAccount")}</Txt>
                  <Link label={t("proCreate")} onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/${siteLang(lang, country)}/${country.toLowerCase()}/pro/inscription`).catch(() => {})} />
                </View>
              ) : (
                <>
                  <Link label={t(mode === "in" ? "noAccount" : "haveAccount")} onPress={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} />
                  <Link label={t("guest")} quiet onPress={leave} />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Link({ label, onPress, quiet }: { label: string; onPress: () => void; quiet?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={({ pressed }) => [{ alignSelf: "center", paddingVertical: 8, paddingHorizontal: 10 }, pressed ? { opacity: 0.6 } : null]}>
      <Text style={{ fontFamily: F.semi, fontSize: 15, color: quiet ? C.soft : C.blue }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 30, minHeight: 330 },
  photo: { position: "absolute", right: 0, bottom: 0, width: 150, height: 214, borderTopLeftRadius: 100 },
  sheet: { flexGrow: 1, marginTop: -26, backgroundColor: C.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 26 },
});
