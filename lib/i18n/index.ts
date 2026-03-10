import { en } from "@/lib/i18n/dictionaries/en";
import { sq } from "@/lib/i18n/dictionaries/sq";

export const supportedLocales = ["sq", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

const dictionaries = {
  sq,
  en,
} as const;

function normalizeLocale(value?: string | null): Locale {
  if (value === "en") {
    return "en";
  }

  return "sq";
}

export function getCurrentLocale(): Locale {
  return normalizeLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
}

export function getMessages(locale?: Locale) {
  const resolved = locale ?? getCurrentLocale();
  return dictionaries[resolved];
}

