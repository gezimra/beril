import type { NavItem } from "@/types/navigation";
import { getMessages } from "@/lib/i18n";

const messages = getMessages();

export const mainNavItems: NavItem[] = [
  { label: messages.nav.home, href: "/" },
  { label: messages.nav.watches, href: "/watches" },
  { label: messages.nav.eyewear, href: "/eyewear" },
  { label: messages.nav.service, href: "/service" },
  { label: messages.nav.trackRepair, href: "/repair-track" },
  { label: messages.nav.about, href: "/about" },
  { label: messages.nav.contact, href: "/contact" },
  { label: messages.nav.journal, href: "/journal" },
];

export const legalNavItems: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
];
