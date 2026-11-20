import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/Screen";
import { Card, Icon, Notice, PillButton, Txt } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { pushState, registerPush, type PushState } from "@/lib/push";
import { C } from "@/lib/theme";

/**
 * Result of a booking: reached after the payment page (the browser hands control back through televet://paid?…)
 * and directly from the booking screen when nothing has to be paid online.
 */
export default function Paid() {
  const { t, lang } = useI18n(), router = useRouter();
  const { status } = useLocalSearchParams<{ booking?: string; status?: string }>();
  const kind = status === "failed" ? "fail" : status === "cancel" ? "cancel" : status === "pending" ? "wait" : "ok";
  const [push, setPush] = useState<PushState>("unavailable");
  useEffect(() => { pushState().then(setPush); }, []);
  // "cancel": the person closed the payment page — go back to the booking screen, which offers to resume or cancel
  useEffect(() => { if (kind === "cancel" && router.canGoBack()) router.back(); }, [kind, router]);
  const toAppointments = () => { if (router.canDismiss()) router.dismissAll(); router.replace("/o/appointments"); };
  const good = kind === "ok" || kind === "wait";
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 18, paddingTop: 60 }}>
        <Card style={{ alignItems: "center", gap: 12, paddingVertical: 30 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", backgroundColor: good ? C.okBg : C.dangerBg }}>
            <Icon name={kind === "ok" ? "check-bold" : kind === "wait" ? "timer-sand" : "close-thick"} size={36} color={good ? C.ok : C.danger} />
          </View>
          <Txt v="h2" center>{t(kind === "ok" ? "doneT" : kind === "wait" ? "payWaitT" : "payFailT")}</Txt>
          <Txt v="body" color={C.soft} center>{t(kind === "ok" ? "doneP" : kind === "wait" ? "payWaitP" : "payFailP")}</Txt>
        </Card>
        {good && push === "off" && (
          <Card style={{ gap: 10 }}>
            <Txt v="small">{t("notifWhyOwner")}</Txt>
            <PillButton kind="outline" small icon="bell-outline" label={t("notifEnable")} onPress={() => registerPush(lang, true).then(setPush)} />
          </Card>
        )}
        {push === "denied" && good && <Notice text={t("notifDenied")} />}
        <PillButton label={t("seeAppointments")} arrow onPress={toAppointments} />
      </View>
    </Screen>
  );
}
