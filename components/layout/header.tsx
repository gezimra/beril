import { MessageCircleMore, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDrawer } from "@/components/layout/search-drawer";
import { mainNavItems } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-graphite/10 bg-ivory/85 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-5 xl:gap-6">
          <BrandMark className="shrink-0" />
          <nav className="hidden min-w-0 items-center gap-1 xl:flex">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-2.5 py-2 text-[0.68rem] uppercase tracking-[0.14em] text-graphite/82 transition hover:bg-white/80 hover:text-graphite 2xl:px-3 2xl:text-xs",
                  item.href === "/repair-track"
                    ? "text-center leading-tight"
                    : "whitespace-nowrap",
                  item.href === "/journal" ? "hidden 2xl:inline-flex" : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <SearchDrawer compact />
          <Link
            href="/cart"
            aria-label="Cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-graphite/15 bg-white/75 text-graphite transition hover:bg-white"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
          <TrackedExternalLink
            href={siteConfig.whatsappHref}
            eventName="click_whatsapp"
            payload={{
              route: "global",
              source: "header",
              destination: siteConfig.whatsappHref,
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-mineral/30 bg-mineral/10 px-3 text-xs uppercase tracking-[0.12em] text-mineral transition hover:bg-mineral/20 2xl:px-4"
          >
            <MessageCircleMore className="h-4 w-4" />
            <span className="hidden 2xl:inline">WhatsApp</span>
          </TrackedExternalLink>
          <Link
            href="/service/request"
            className="inline-flex h-11 items-center rounded-full bg-walnut px-4 text-sm font-medium text-white transition hover:bg-walnut/90 2xl:px-5"
          >
            <span className="xl:hidden 2xl:inline">Book Service</span>
            <span className="hidden xl:inline 2xl:hidden">Service</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <SearchDrawer compact />
          <Link
            href="/cart"
            aria-label="Cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-graphite/15 bg-white/75 text-graphite"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
          <MobileNav items={mainNavItems} />
        </div>
      </Container>
    </header>
  );
}
