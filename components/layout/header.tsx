import { MessageCircleMore, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDrawer } from "@/components/layout/search-drawer";
import { mainNavItems } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-graphite/10 bg-ivory/85 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-8">
          <BrandMark />
          <nav className="hidden xl:flex items-center gap-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em] text-graphite/82 transition hover:bg-white/80 hover:text-graphite"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <SearchDrawer />
          <Link
            href="/cart"
            aria-label="Cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-graphite/15 bg-white/75 text-graphite transition hover:bg-white"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
          <a
            href={siteConfig.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-mineral/30 bg-mineral/10 px-4 text-xs uppercase tracking-[0.12em] text-mineral transition hover:bg-mineral/20"
          >
            <MessageCircleMore className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href="/service/request"
            className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white transition hover:bg-walnut/90"
          >
            Book Service
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
