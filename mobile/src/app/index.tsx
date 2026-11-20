import { Redirect } from "expo-router";
import { IS_VET } from "@/lib/config";
import { useSession } from "@/lib/session";

/** Entry point: the owners' app opens on the home (no account needed to look around); the vets' app needs a sign-in. */
export default function Index() {
  const { ready, session } = useSession();
  if (!ready) return null;
  if (IS_VET) return <Redirect href={session ? "/v" : "/login"} />;
  return <Redirect href="/o" />;
}
