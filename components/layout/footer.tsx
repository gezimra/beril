import Link from "next/link";

import { Container } from "@/components/layout/container";
import { legalNavItems, mainNavItems } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-graphite/10 bg-stone/45">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-display text-3xl tracking-[0.18em] text-graphite">BERIL</p>
          <p className="max-w-xs text-sm text-graphite/75">
            Curated watches, refined eyewear, and trusted service in Gjilan.
          </p>
          <div className="space-y-1 text-sm text-graphite/75">
            <p>{siteConfig.location}</p>
            <a href={siteConfig.phoneHref} className="block hover:text-graphite">
              {siteConfig.phoneLabel}
            </a>
            <a href={`mailto:${siteConfig.email}`} className="block hover:text-graphite">
              {siteConfig.email}
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-graphite/60">
            Navigate
          </p>
          <ul className="space-y-2 text-sm text-graphite/78">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-graphite">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-graphite/60">
            Legal
          </p>
          <ul className="space-y-2 text-sm text-graphite/78">
            {legalNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-graphite">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-graphite/60">
            {new Date().getFullYear()} BERIL. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
