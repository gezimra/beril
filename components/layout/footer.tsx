import Link from "next/link";

import { Container } from "@/components/layout/container";
import { getMessages } from "@/lib/i18n";
import { legalNavItems, mainNavItems } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

export function Footer() {
  const messages = getMessages();

  return (
    <footer className="border-t border-graphite/10 bg-stone/42">
      <Container className="grid gap-9 py-12 md:grid-cols-[1.25fr_1fr_1fr] md:gap-10">
        <div className="space-y-4">
          <p className="font-display text-3xl tracking-[0.2em] text-graphite">BERIL</p>
          <p className="max-w-sm text-sm text-graphite/74">
            {messages.footer.aboutLine}
          </p>
          <div className="space-y-1.5 text-sm text-graphite/78">
            <p>{siteConfig.location}</p>
            <a href={siteConfig.phoneHref} className="block transition hover:text-graphite">
              {siteConfig.phoneLabel}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="block transition hover:text-graphite"
            >
              {siteConfig.email}
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-graphite/58">
            {messages.footer.navigate}
          </p>
          <ul className="space-y-2.5 text-sm text-graphite/78">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-graphite">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-graphite/58">
            {messages.footer.legal}
          </p>
          <ul className="space-y-2.5 text-sm text-graphite/78">
            {legalNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-graphite">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-7 border-t border-graphite/10 pt-4 text-xs text-graphite/56">
            {new Date().getFullYear()} BERIL. {messages.footer.rights}
          </p>
        </div>
      </Container>
    </footer>
  );
}
