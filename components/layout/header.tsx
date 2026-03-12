"use client";

import { ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { useCart } from "@/components/commerce/cart-provider";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDrawer } from "@/components/layout/search-drawer";
import type { CustomerAccountUser } from "@/lib/db/customer-account";
import { getMessages, LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n";
import { getMainNavItems } from "@/lib/navigation";

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface HeaderProps {
  customerUser: CustomerAccountUser | null;
  watchBrands: string[];
  eyewearBrands: string[];
  locale: Locale;
}

interface CatalogDropdownProps {
  label: string;
  href: string;
  brands: string[];
  isActive: boolean;
  viewAllLabel: string;
}

interface ServiceDropdownProps {
  label: string;
  isActive: boolean;
  serviceOverviewLabel: string;
  requestRepairLabel: string;
  trackRepairLabel: string;
}

function CatalogDropdown({
  label,
  href,
  brands,
  isActive,
  viewAllLabel,
}: CatalogDropdownProps) {
  const topBrands = brands.slice(0, 8);

  return (
    <div className="group relative">
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={["nav-pill whitespace-nowrap", isActive ? "nav-pill-active" : ""].join(" ")}
      >
        {label}
      </Link>
      {topBrands.length > 0 ? (
        <div className="pointer-events-none absolute left-0 top-full z-50 pt-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <div className="min-w-[13.5rem] rounded-[var(--radius-card-inner)] border border-graphite/14 bg-ivory/98 p-3 shadow-[0_24px_48px_-30px_rgba(44,44,44,0.55)]">
            <Link
              href={href}
              className="inline-flex rounded-md px-2 py-1 text-xs uppercase tracking-[0.13em] text-graphite/72 transition hover:bg-white hover:text-graphite"
            >
              {viewAllLabel}
            </Link>
            <div className="my-2 h-px bg-graphite/10" />
            <ul className="space-y-1">
              {topBrands.map((brand) => (
                <li key={`${href}-${brand}`}>
                  <Link
                    href={`${href}?brand=${encodeURIComponent(brand)}`}
                    className="block rounded-md px-2 py-1 text-sm text-graphite/84 transition hover:bg-white hover:text-graphite"
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ServiceDropdown({
  label,
  isActive,
  serviceOverviewLabel,
  requestRepairLabel,
  trackRepairLabel,
}: ServiceDropdownProps) {
  const links = [
    { href: "/service", label: serviceOverviewLabel },
    { href: "/service/request", label: requestRepairLabel },
    { href: "/repair-track", label: trackRepairLabel },
  ];

  return (
    <div className="group relative">
      <Link
        href="/service"
        aria-current={isActive ? "page" : undefined}
        className={["nav-pill whitespace-nowrap", isActive ? "nav-pill-active" : ""].join(" ")}
      >
        {label}
      </Link>
      <div className="pointer-events-none absolute left-0 top-full z-50 pt-2 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="min-w-[14rem] rounded-[var(--radius-card-inner)] border border-graphite/14 bg-ivory/98 p-3 shadow-[0_24px_48px_-30px_rgba(44,44,44,0.55)]">
          <ul className="space-y-1">
            {links.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="block rounded-md px-2 py-1 text-sm text-graphite/84 transition hover:bg-white hover:text-graphite"
                >
                  {entry.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function LanguageSwitcher({
  locale,
  onChange,
  className = "",
}: {
  locale: Locale;
  onChange: (nextLocale: Locale) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center rounded-full border border-graphite/12 bg-white/75 p-0.5 ${className}`}>
      {(["sq", "en"] as const).map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={[
              "inline-flex h-7 items-center rounded-full px-2.5 text-[0.62rem] uppercase tracking-[0.14em] transition",
              active
                ? "bg-graphite text-white"
                : "text-graphite/75 hover:bg-white hover:text-graphite",
            ].join(" ")}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function Header({
  customerUser,
  watchBrands,
  eyewearBrands,
  locale,
}: HeaderProps) {
  const pathname = usePathname();
  const signedIn = Boolean(customerUser);
  const messages = getMessages(locale);
  const mainNavItems = getMainNavItems(locale);
  const { items } = useCart();
  const cartItemsCount = items.length;
  const cartBadge = cartItemsCount > 9 ? "9+" : String(cartItemsCount);

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      window.location.reload();
    });
  };

  return (
    <header className="sticky top-0 z-40 overflow-x-clip border-b border-graphite/10 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto w-full px-2 py-2 sm:px-6 lg:px-8 xl:px-10">
        <div className="hidden min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 lg:grid">
          <BrandMark className="shrink-0" locale={locale} />
          <nav className="min-w-0 flex flex-1 flex-nowrap items-center justify-center gap-x-1 py-1">
            {mainNavItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              const isServiceActive =
                isNavItemActive(pathname, "/service") ||
                isNavItemActive(pathname, "/repair-track");

              if (item.href === "/watches") {
                return (
                  <CatalogDropdown
                    key={item.href}
                    label={item.label}
                    href={item.href}
                    brands={watchBrands}
                    isActive={isActive}
                    viewAllLabel={messages.common.viewAll}
                  />
                );
              }

              if (item.href === "/eyewear") {
                return (
                  <CatalogDropdown
                    key={item.href}
                    label={item.label}
                    href={item.href}
                    brands={eyewearBrands}
                    isActive={isActive}
                    viewAllLabel={messages.common.viewAll}
                  />
                );
              }

              if (item.href === "/service") {
                return (
                  <ServiceDropdown
                    key={item.href}
                    label={item.label}
                    isActive={isServiceActive}
                    serviceOverviewLabel={messages.mobileNav.serviceOverview}
                    requestRepairLabel={messages.mobileNav.requestRepair}
                    trackRepairLabel={messages.mobileNav.trackRepair}
                  />
                );
              }

              if (item.href === "/repair-track") {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={["nav-pill whitespace-nowrap", isActive ? "nav-pill-active" : ""].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <LanguageSwitcher locale={locale} onChange={handleLocaleChange} />
            <SearchDrawer compact triggerClassName="icon-button" locale={locale} />
            <Link
              href="/cart"
              aria-label={messages.header.cartAria}
              className="icon-button relative"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartItemsCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex h-5 w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-walnut text-[0.52rem] font-medium leading-none text-white sm:-right-1.5 sm:-top-1.5 sm:translate-x-0 sm:translate-y-0">
                  {cartBadge}
                </span>
              ) : null}
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

          </div>
        </div>

        <div className="flex min-h-20 items-center gap-1.5 lg:hidden">
          <BrandMark className="min-w-0 shrink" locale={locale} compact />
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <SearchDrawer compact triggerClassName="icon-button h-8 w-8" locale={locale} />
            <Link
              href="/cart"
              aria-label={messages.header.cartAria}
              className="icon-button relative h-8 w-8"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartItemsCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex h-4 w-4 -translate-y-1/4 items-center justify-center rounded-full bg-walnut text-[0.48rem] font-medium leading-none text-white">
                  {cartBadge}
                </span>
              ) : null}
            </Link>
            <MobileNav
              items={mainNavItems}
              customerUser={customerUser}
              watchBrands={watchBrands}
              eyewearBrands={eyewearBrands}
              locale={locale}
              onLocaleChange={handleLocaleChange}
            />
          </div>
        </div>

      </div>
    </header>
  );
}
