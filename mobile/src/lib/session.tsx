import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sb } from "./supabase";
import { registerPush, unregisterPush } from "./push";
import { useI18n } from "./i18n";

type Ctx = { ready: boolean; session: Session | null; user: User | null; signOut: () => Promise<void> };
const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const [ready, setReady] = useState(false), [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let alive = true;
    sb().auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setReady(true); } }).catch(() => alive && setReady(true));
    const { data: sub } = sb().auth.onAuthStateChange((_event, s) => { if (alive) setSession(s); });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  // this phone receives the account's notifications from sign-in until sign-out
  const uid = session?.user.id;
  useEffect(() => { if (uid) registerPush(lang, false).catch(() => {}); }, [uid, lang]);
  const signOut = useCallback(async () => {
    await unregisterPush();
    await sb().auth.signOut().catch(() => {});
    setSession(null);
  }, []);
  const value = useMemo(() => ({ ready, session, user: session?.user ?? null, signOut }), [ready, session, signOut]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): Ctx {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("SessionProvider missing");
  return c;
}
