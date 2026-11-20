import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Choice, Icon, Notice, PillButton, Row, Txt } from "./ui";
import { COUNTRY_NAMES, COUNTRY_ORDER, LANGS, LANG_NAMES, siteLang, type Lang } from "@/copy";
import { flag, openWeb } from "@/lib/actions";
import { API_URL, APP_VERSION, IS_VET } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { pushState, registerPush, type PushState } from "@/lib/push";
import { useSession } from "@/lib/session";
import { C, F } from "@/lib/theme";

/** Settings shared by the two apps: notifications, language, country (owners), legal and help pages, version. */
export function Settings() {
  const { t, lang, country, setLang, setCountry } = useI18n(), { session } = useSession();
  const [push, setPush] = useState<PushState>("unavailable"), [open, setOpen] = useState(false);
  useFocusEffect(useCallback(() => { pushState().then(setPush); }, []));
  const li = LANGS.indexOf(lang);
  const site = `${API_URL}/${siteLang(lang, country)}/${country.toLowerCase()}`;
  return (
    <>
      {session && push !== "unavailable" && (
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name={push === "on" ? "bell-ring-outline" : "bell-outline"} size={24} color={C.blue} />
            <View style={{ flex: 1 }}><Txt v="h3">{t("notifications")}</Txt><Txt v="small">{push === "on" ? t("notifOn") : t(IS_VET ? "notifWhyVet" : "notifWhyOwner")}</Txt></View>
          </View>
          {push === "off" && <PillButton small icon="bell-outline" label={t("notifEnable")} onPress={() => registerPush(lang, true).then(setPush)} />}
          {push === "denied" && <Notice text={t("notifDenied")} />}
        </Card>
      )}

      <Card style={{ gap: 12 }}>
        <Txt v="h3">{t("language")}</Txt>
        <Choice wrap value={lang} onChange={(l: Lang) => setLang(l)} options={LANGS.map((l) => ({ value: l, label: LANG_NAMES[l] }))} />
        {!IS_VET && <>
          <Txt v="h3" style={{ marginTop: 6 }}>{t("country")}</Txt>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${t("country")}: ${COUNTRY_NAMES[country]?.[li] ?? country}`} onPress={() => setOpen(!open)} style={({ pressed }) => [st.select, pressed ? { opacity: 0.8 } : null]}>
            <Text style={{ fontSize: 20 }}>{flag(country)}</Text>
            <Text style={st.selectTxt}>{COUNTRY_NAMES[country]?.[li] ?? country}</Text>
            <Icon name={open ? "chevron-up" : "chevron-down"} size={22} color={C.blue} />
          </Pressable>
          {open && (
            <View accessibilityRole="radiogroup" style={{ gap: 2 }}>
              {COUNTRY_ORDER.map((cc) => (
                <Pressable key={cc} accessibilityRole="radio" accessibilityState={{ selected: cc === country }} accessibilityLabel={COUNTRY_NAMES[cc][li]} onPress={() => { setCountry(cc); setOpen(false); }} style={({ pressed }) => [st.option, cc === country ? { backgroundColor: C.tint } : null, pressed ? { opacity: 0.7 } : null]}>
                  <Text style={{ fontSize: 18 }}>{flag(cc)}</Text>
                  <Text style={[st.optionTxt, cc === country ? { fontFamily: F.bold, color: C.blue } : null]}>{COUNTRY_NAMES[cc][li]}</Text>
                  {cc === country && <Icon name="check" size={20} color={C.blue} />}
                </Pressable>
              ))}
            </View>
          )}
        </>}
      </Card>

      <Card style={{ paddingVertical: 8 }}>
        <Row icon="shield-check-outline" value={t("legal")} onPress={() => openWeb(`${site}/legal`)} />
        <Row icon="lifebuoy" value={t("help")} onPress={() => openWeb(`${site}/contact`)} />
      </Card>
      <Txt v="tiny" center>{IS_VET ? "Televet Pro" : "Televet"} · {t("version")} {APP_VERSION}</Txt>
    </>
  );
}

const st = StyleSheet.create({
  select: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white },
  selectTxt: { flex: 1, fontFamily: F.semi, fontSize: 16, color: C.ink },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 46, paddingHorizontal: 14, borderRadius: 12 },
  optionTxt: { flex: 1, fontFamily: F.medium, fontSize: 15.5, color: C.ink },
});
