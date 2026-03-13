"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CustomerAccountUser } from "@/lib/db/customer-account";
import { getMessages, type Locale } from "@/lib/i18n";
import type { NavItem } from "@/types/navigation";

interface MobileNavProps {
  items: NavItem[];
  customerUser: CustomerAccountUser | null;
  watchBrands: string[];
  eyewearBrands: string[];
  locale: Locale;
  onLocaleChange: (nextLocale: Locale) => void;
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({
  items,
  customerUser,
  watchBrands,
  eyewearBrands,
  locale,
  onLocaleChange,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const canUseDom = typeof document !== "undefined";
  const pathname = usePathname();
  const signedIn = Boolean(customerUser);
  const messages = getMessages(locale);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setExpanded(null);
  }, [pathname]);

  const openMenu = () => {
    startTransition(() => setIsOpen(true));
  };

  const closeMenu = () => {
    startTransition(() => setIsOpen(false));
    setExpanded(null);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={messages.mobileNav.open}
        aria-expanded={isOpen}
        className="icon-button h-8 w-8"
        onClick={openMenu}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {canUseDom
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  className="fixed inset-0 z-[90] bg-graphite/52"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeMenu}
                >
                  <motion.aside
                    className="ml-auto flex h-full w-full flex-col overflow-y-auto border-l border-graphite/10 bg-ivory px-6 pb-8 pt-6 shadow-[-24px_0_60px_-36px_rgba(44,44,44,0.45)] sm:w-[82vw] sm:max-w-sm"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.22em] text-graphite/65">
                        BERIL
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={messages.mobileNav.close}
                        onClick={closeMenu}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="mb-5 inline-flex items-center rounded-full border border-graphite/12 bg-white/76 p-0.5">
                      {(["sq", "en"] as const).map((item) => {
                        const active = item === locale;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => onLocaleChange(item)}
                            className={[
                              "inline-flex h-8 items-center rounded-full px-3 text-[0.62rem] uppercase tracking-[0.14em] transition",
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

                    <nav className="flex flex-col gap-2">
                      {items.map((item) => {
                        const isActive = isNavItemActive(pathname, item.href);
                        const isExpanded = expanded === item.href;

                        if (item.href === "/repair-track") {
                          return null;
                        }

                        if (item.href === "/watches" || item.href === "/eyewear") {
                          const brands = item.href === "/watches" ? watchBrands : eyewearBrands;
                          const topBrands = brands.slice(0, 8);

                          return (
                            <div
                              key={item.href}
                              className="rounded-2xl border border-graphite/8 bg-white/58"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded((current) =>
                                    current === item.href ? null : item.href,
                                  )
                                }
                                className={[
                                  "flex w-full items-center justify-between px-4 py-3 text-sm uppercase tracking-[0.12em] transition",
                                  isActive
                                    ? "text-walnut"
                                    : "text-graphite/85",
                                ].join(" ")}
                              >
                                <span>{item.label}</span>
                                <ChevronDown
                                  className={[
                                    "h-4 w-4 text-graphite/62 transition-transform",
                                    isExpanded ? "rotate-180" : "",
                                  ].join(" ")}
                                />
                              </button>

                              {isExpanded ? (
                                <div className="space-y-1 border-t border-graphite/10 px-3 pb-3 pt-2">
                                  <Link
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="block rounded-lg px-3 py-2 text-xs uppercase tracking-[0.13em] text-graphite/72 transition hover:bg-white/86 hover:text-graphite"
                                  >
                                    {messages.common.viewAll}
                                  </Link>
                                  {topBrands.map((brand) => (
                                    <Link
                                      key={`${item.href}-${brand}`}
                                      href={`${item.href}?brand=${encodeURIComponent(brand)}`}
                                      onClick={closeMenu}
                                      className="block rounded-lg px-3 py-2 text-sm text-graphite/82 transition hover:bg-white/86 hover:text-graphite"
                                    >
                                      {brand}
                                    </Link>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        if (item.href === "/service") {
                          return (
                            <div
                              key={item.href}
                              className="rounded-2xl border border-graphite/8 bg-white/58"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded((current) =>
                                    current === item.href ? null : item.href,
                                  )
                                }
                                className={[
                                  "flex w-full items-center justify-between px-4 py-3 text-sm uppercase tracking-[0.12em] transition",
                                  isActive || isNavItemActive(pathname, "/repair-track")
                                    ? "text-walnut"
                                    : "text-graphite/85",
                                ].join(" ")}
                              >
                                <span>{item.label}</span>
                                <ChevronDown
                                  className={[
                                    "h-4 w-4 text-graphite/62 transition-transform",
                                    isExpanded ? "rotate-180" : "",
                                  ].join(" ")}
                                />
                              </button>
                              {isExpanded ? (
                                <div className="space-y-1 border-t border-graphite/10 px-3 pb-3 pt-2">
                                  {[
                                    { href: "/service", label: messages.mobileNav.serviceOverview },
                                    { href: "/service/request", label: messages.mobileNav.requestRepair },
                                    { href: "/repair-track", label: messages.mobileNav.trackRepair },
                                  ].map((entry) => (
                                    <Link
                                      key={entry.href}
                                      href={entry.href}
                                      onClick={closeMenu}
                                      className="block rounded-lg px-3 py-2 text-sm text-graphite/82 transition hover:bg-white/86 hover:text-graphite"
                                    >
                                      {entry.label}
                                    </Link>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            aria-current={isActive ? "page" : undefined}
                            className={[
                              "rounded-2xl border px-4 py-3 text-sm uppercase tracking-[0.12em] transition",
                              isActive
                                ? "border-champagne/65 bg-white/90 text-walnut"
                                : "border-graphite/8 bg-white/58 text-graphite/85 hover:border-graphite/15 hover:bg-white/78",
                            ].join(" ")}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="mt-7 rounded-2xl border border-graphite/10 bg-white/58 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-graphite/62">
                        {messages.mobileNav.account}
                      </p>
                      {signedIn ? (
                        <>
                          <p className="mt-2 text-sm font-medium text-mineral">{messages.header.signedIn}</p>
                          <p className="mt-1 text-xs text-graphite/72">{customerUser?.email}</p>
                          <Link
                            href="/account"
                            onClick={closeMenu}
                            className="mt-3 inline-flex h-9 items-center rounded-full border border-mineral/35 bg-mineral/10 px-4 text-xs uppercase tracking-[0.12em] text-mineral"
                          >
                            {messages.mobileNav.myAccount}
                          </Link>
                        </>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href="/account/login"
                            onClick={closeMenu}
                            className="inline-flex h-9 items-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
                          >
                            {messages.mobileNav.login}
                          </Link>
                          <Link
                            href="/account/register"
                            onClick={closeMenu}
                            className="inline-flex h-9 items-center rounded-full border border-graphite/15 bg-white/80 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                          >
                            {messages.mobileNav.register}
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-graphite/10 pt-6">
                      <Link
                        href="/service/request"
                        onClick={closeMenu}
                        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
                      >
                        {messages.header.serviceCta}
                      </Link>
                    </div>
                  </motion.aside>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
