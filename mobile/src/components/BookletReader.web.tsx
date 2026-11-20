import { useImperativeHandle, type Ref } from "react";
import type { Proposal } from "@/lib/types";

export type BookletReaderHandle = { read: (base64Jpeg: string, lang: string) => Promise<Proposal[] | null> };

/** Browser preview of the app: there is no in-app web view, so automatic reading is simply skipped (the photo is still saved). */
export function BookletReader({ ref }: { ref?: Ref<BookletReaderHandle> }) {
  useImperativeHandle(ref, () => ({ read: async () => null }), []);
  return null;
}
