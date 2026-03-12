import { en } from "@/lib/i18n/dictionaries/en";
import { sq } from "@/lib/i18n/dictionaries/sq";

export const supportedLocales = ["sq", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export const LOCALE_COOKIE_NAME = "beril_locale";

const dictionaries = {
  sq,
  en,
} as const;

export function normalizeLocale(value?: string | null): Locale {
  if (value === "en") {
    return "en";
  }

  return "sq";
}

function readLocaleFromCookieValue(cookieValue: string | undefined): Locale | null {
  if (!cookieValue) {
    return null;
  }

  const pairs = cookieValue.split(";");
  for (const pair of pairs) {
    const [rawKey, rawValue] = pair.trim().split("=");
    if (rawKey !== LOCALE_COOKIE_NAME) {
      continue;
    }

    return normalizeLocale(rawValue ?? null);
  }

  return null;
}

export function getCurrentLocale(): Locale {
  if (typeof document !== "undefined") {
    const fromCookie = readLocaleFromCookieValue(document.cookie);
    if (fromCookie) {
      return fromCookie;
    }
  }

  return "sq";
}

export function getMessages(locale?: Locale) {
  const resolved = locale ?? getCurrentLocale();
  return dictionaries[resolved];
}
