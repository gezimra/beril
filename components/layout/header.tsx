"use client";

import { MessageCircle, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDrawer } from "@/components/layout/search-drawer";
import { trackEvent } from "@/lib/analytics/track";
import type { CustomerAccountUser } from "@/lib/db/customer-account";
import { getMessages } from "@/lib/i18n";
import { mainNavItems } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface HeaderProps {
  customerUser: CustomerAccountUser | null;
}

export function Header({ customerUser }: HeaderProps) {
  const pathname = usePathname();
  const signedIn = Boolean(customerUser);
  const messages = getMessages();

  return (
    <header className="sticky top-0 z-40 border-b border-graphite/10 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto w-full px-4 py-2 sm:px-6 lg:px-8 xl:px-10">
        <div className="hidden min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 lg:grid">
          <BrandMark className="shrink-0" />
          <nav className="min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 gap-y-1.5 py-1">
            {mainNavItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "nav-pill",
                    item.href === "/repair-track"
                      ? "text-center leading-tight"
                      : "whitespace-nowrap",
                    isActive ? "nav-pill-active" : "",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <SearchDrawer compact triggerClassName="icon-button" />
            <Link
              href="/cart"
              aria-label={messages.header.cartAria}
              className="icon-button"
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
            <Link
              href="/account"
              aria-label={messages.header.accountAria}
              className={[
                "icon-button relative",
                signedIn
                  ? "border-mineral/30 bg-mineral/10 text-mineral hover:bg-mineral/16"
                  : "",
              ].join(" ")}
            >
              <UserRound className="h-4 w-4" />
              {signedIn ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-mineral" />
              ) : null}
            </Link>
            <a
              href={siteConfig.whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label={messages.header.chatAria}
              onClick={() =>
                trackEvent("click_whatsapp", {
                  route: pathname,
                  source: "header_chat",
                  destination: siteConfig.whatsappHref,
                })
              }
              className="icon-button"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <Link
              href="/service/request"
              className="inline-flex h-9 items-center rounded-full bg-walnut/90 px-4 text-xs font-medium uppercase tracking-[0.11em] text-white transition hover:bg-walnut"
            >
              {messages.header.serviceCta}
            </Link>
          </div>
        </div>

        <div className="flex min-h-20 items-center gap-2 lg:hidden">
          <BrandMark className="shrink-0" />
          <div className="ml-auto flex items-center gap-1">
            <SearchDrawer compact triggerClassName="icon-button" />
            <Link
              href="/cart"
              aria-label={messages.header.cartAria}
              className="icon-button"
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
            <Link
              href="/account"
              aria-label={messages.header.accountAria}
              className={[
                "icon-button relative",
                signedIn ? "border-mineral/30 bg-mineral/10 text-mineral" : "",
              ].join(" ")}
            >
              <UserRound className="h-4 w-4" />
              {signedIn ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-mineral" />
              ) : null}
            </Link>
            <MobileNav items={mainNavItems} customerUser={customerUser} />
          </div>
        </div>

        <div className="hidden pt-1 lg:block 2xl:hidden">
          {signedIn ? (
            <Link
              href="/account"
              className="inline-flex h-8 items-center gap-2 rounded-full border border-mineral/28 bg-mineral/10 px-3 text-[0.62rem] uppercase tracking-[0.11em] text-mineral"
            >
              <span className="h-2 w-2 rounded-full bg-mineral" />
              {messages.header.signedIn}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
