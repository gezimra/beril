"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

interface SearchDrawerProps {
  compact?: boolean;
  triggerClassName?: string;
}

const RECENT_SEARCH_KEY = "beril_recent_searches_v1";

export function SearchDrawer({
  compact = false,
  triggerClassName,
}: SearchDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const canUseDom = typeof document !== "undefined";
  const messages = getMessages();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
      if (!raw) {
        setRecentSearches([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setRecentSearches([]);
        return;
      }

      setRecentSearches(
        parsed
          .filter((entry): entry is string => typeof entry === "string")
          .slice(0, 5),
      );
    } catch {
      setRecentSearches([]);
    }
  }, [isOpen]);

  function addRecentSearch(term: string) {
    const normalized = term.trim();
    if (!normalized || typeof window === "undefined") {
      return;
    }

    setRecentSearches((current) => {
      const next = [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, 5);
      window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
      return next;
    });
  }

  const openDrawer = () => {
    startTransition(() => setIsOpen(true));
  };

  const closeDrawer = () => {
    startTransition(() => setIsOpen(false));
  };

  return (
    <>
      <Button
        aria-label={messages.header.searchAria}
        variant="ghost"
        size={compact ? "icon" : "default"}
        className={cn(compact ? "h-10 w-10" : "h-10", triggerClassName)}
        onClick={openDrawer}
      >
        <Search className="h-4 w-4" />
        {!compact && <span>Search</span>}
      </Button>

      {canUseDom
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <motion.div
                  className="fixed inset-0 z-[85] bg-graphite/35 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeDrawer}
                >
                  <motion.div
                    className="mx-auto mt-16 w-[92vw] max-w-2xl rounded-2xl border border-graphite/10 bg-ivory p-5 shadow-[0_26px_60px_-34px_rgba(47,75,68,0.65)]"
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between">
                      <p className="premium-eyebrow">
                        {messages.search.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Close search"
                        onClick={closeDrawer}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <label htmlFor="search-input" className="sr-only">
                      Search watches and eyewear
                    </label>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        addRecentSearch(query);
                      }}
                      className="space-y-4"
                    >
                      <input
                        id="search-input"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={messages.search.inputPlaceholder}
                        className="input-premium h-12 px-4"
                      />
                      <div className="space-y-3">
                        <div>
                          <p className="label-muted">{messages.search.suggestedLabel}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {messages.search.suggested.map((term) => (
                              <button
                                key={term}
                                type="button"
                                onClick={() => {
                                  setQuery(term);
                                  addRecentSearch(term);
                                }}
                                className="inline-flex h-8 items-center rounded-full border border-graphite/12 bg-white/80 px-3 text-xs text-graphite/80 transition hover:bg-white"
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="label-muted">{messages.search.quickCategoriesLabel}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[
                              { href: "/watches", label: "Watches" },
                              { href: "/eyewear", label: "Eyewear" },
                              { href: "/service", label: "Service" },
                              { href: "/repair-track", label: "Track Repair" },
                            ].map((entry) => (
                              <Link
                                key={entry.href}
                                href={entry.href}
                                onClick={closeDrawer}
                                className="inline-flex h-8 items-center rounded-full border border-graphite/12 bg-white/80 px-3 text-xs uppercase tracking-[0.1em] text-graphite/80 transition hover:bg-white"
                              >
                                {entry.label}
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="label-muted">{messages.search.recentLabel}</p>
                          {recentSearches.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {recentSearches.map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => setQuery(term)}
                                  className="inline-flex h-8 items-center rounded-full border border-mineral/25 bg-mineral/10 px-3 text-xs text-mineral"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-graphite/62">
                              {messages.search.helper}
                            </p>
                          )}
                        </div>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
