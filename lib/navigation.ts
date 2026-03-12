import type { NavItem } from "@/types/navigation";
import { getMessages, type Locale } from "@/lib/i18n";

export function getMainNavItems(locale?: Locale): NavItem[] {
  const messages = getMessages(locale);
  return [
    { label: messages.nav.home, href: "/" },
    { label: messages.nav.watches, href: "/watches" },
    { label: messages.nav.eyewear, href: "/eyewear" },
    { label: messages.nav.service, href: "/service" },
    { label: messages.nav.trackRepair, href: "/repair-track" },
    { label: messages.nav.about, href: "/about" },
    { label: messages.nav.contact, href: "/contact" },
    { label: messages.nav.journal, href: "/journal" },
  ];
}

export function getLegalNavItems(locale?: Locale): NavItem[] {
  const messages = getMessages(locale);
  return [
    { label: messages.legal.privacyPolicy, href: "/privacy-policy" },
    { label: messages.legal.terms, href: "/terms" },
    { label: messages.legal.cookies, href: "/cookies" },
  ];
}
