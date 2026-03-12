import { cookies } from "next/headers";

import {
  getMessages,
  LOCALE_COOKIE_NAME,
  type Locale,
  normalizeLocale,
} from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeLocale(raw ?? null);
}

export async function getServerMessages() {
  const locale = await getServerLocale();
  return getMessages(locale);
}
