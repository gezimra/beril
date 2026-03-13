"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getMessages, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

interface SearchDrawerProps {
  compact?: boolean;
  triggerClassName?: string;
  locale: Locale;
}

type SearchProductResult = {
  id: string;
  href: string;
  title: string;
  brand: string;
  category: "watch" | "eyewear";
  price: number;
  stockStatus: string;
};

type SearchJournalResult = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
};

type SearchPageResult = {
  href: string;
  label: string;
  group: "catalog" | "service" | "info";
};

type SearchResponse = {
  query: string;
  results: {
    products: SearchProductResult[];
    journal: SearchJournalResult[];
    pages: SearchPageResult[];
  };
};

const RECENT_SEARCH_KEY = "beril_recent_searches_v1";

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function SearchDrawer({
  compact = false,
  triggerClassName,
  locale,
}: SearchDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResponse["results"]>({
    products: [],
    journal: [],
    pages: [],
  });
  const [resolvedQuery, setResolvedQuery] = useState("");
  const canUseDom = typeof document !== "undefined";
  const messages = getMessages(locale);
  const deferredQuery = useDeferredValue(query.trim());
  const hasSearched = resolvedQuery.length >= 2;
  const isLoading = deferredQuery.length >= 2 && resolvedQuery !== deferredQuery;
  const hasResults =
    results.products.length > 0 || results.journal.length > 0 || results.pages.length > 0;

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
    if (!isOpen) {
      return;
    }

    const currentQuery = deferredQuery.trim();
    if (currentQuery.length < 2) {
      return;
    }

    const controller = new AbortController();

    fetch(
      `/api/search?q=${encodeURIComponent(currentQuery)}&locale=${encodeURIComponent(locale)}`,
      {
        method: "GET",
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`);
        }
        return (await response.json()) as SearchResponse;
      })
      .then((payload) => {
        setResults(payload.results);
        setResolvedQuery(currentQuery);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setResults({ products: [], journal: [], pages: [] });
        setResolvedQuery(currentQuery);
      });

    return () => controller.abort();
  }, [deferredQuery, isOpen, locale]);

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
    setRecentSearches(loadRecentSearches());
    setQuery("");
    setResults({ products: [], journal: [], pages: [] });
    setResolvedQuery("");
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
                        aria-label={messages.search.closeAria}
                        onClick={closeDrawer}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <label htmlFor="search-input" className="sr-only">
                      {messages.search.inputAria}
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
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={messages.search.inputPlaceholder}
                        className="input-premium h-12 px-4"
                      />
                      {deferredQuery.length >= 2 ? (
                        <div className="space-y-3 rounded-xl border border-graphite/10 bg-white/70 p-3">
                          <p className="label-muted">{messages.search.resultsLabel}</p>
                          {isLoading ? (
                            <p className="text-xs text-graphite/65">
                              {messages.search.loading}
                            </p>
                          ) : null}
                          {!isLoading && hasSearched && !hasResults ? (
                            <p className="text-xs text-graphite/65">
                              {messages.search.noResults}
                            </p>
                          ) : null}
                          {!isLoading && results.products.length > 0 ? (
                            <div>
                              <p className="label-muted">{messages.search.productsLabel}</p>
                              <ul className="mt-2 space-y-1.5">
                                {results.products.map((item) => (
                                  <li key={item.id}>
                                    <Link
                                      href={item.href}
                                      onClick={() => {
                                        addRecentSearch(query);
                                        closeDrawer();
                                      }}
                                      className="block rounded-lg border border-graphite/10 bg-white/85 px-3 py-2 transition hover:bg-white"
                                    >
                                      <p className="text-sm text-graphite">
                                        {item.title}
                                      </p>
                                      <p className="text-xs text-graphite/62">
                                        {item.brand} | {item.price.toFixed(2)} EUR
                                      </p>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {!isLoading && results.pages.length > 0 ? (
                            <div>
                              <p className="label-muted">{messages.search.pagesLabel}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {results.pages.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                      addRecentSearch(query);
                                      closeDrawer();
                                    }}
                                    className="inline-flex h-8 items-center rounded-full border border-graphite/12 bg-white/80 px-3 text-xs uppercase tracking-[0.09em] text-graphite/78 transition hover:bg-white"
                                  >
                                    {item.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {!isLoading && results.journal.length > 0 ? (
                            <div>
                              <p className="label-muted">{messages.search.journalLabel}</p>
                              <ul className="mt-2 space-y-1.5">
                                {results.journal.map((item) => (
                                  <li key={item.id}>
                                    <Link
                                      href={item.href}
                                      onClick={() => {
                                        addRecentSearch(query);
                                        closeDrawer();
                                      }}
                                      className="block rounded-lg border border-graphite/10 bg-white/85 px-3 py-2 transition hover:bg-white"
                                    >
                                      <p className="text-sm text-graphite">
                                        {item.title}
                                      </p>
                                      <p className="line-clamp-2 text-xs text-graphite/62">
                                        {item.excerpt}
                                      </p>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-graphite/62">{messages.search.startTyping}</p>
                      )}
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
                              { href: "/watches", label: messages.search.quickCategories.watches },
                              { href: "/eyewear", label: messages.search.quickCategories.eyewear },
                              { href: "/service", label: messages.search.quickCategories.service },
                              { href: "/repair-track", label: messages.search.quickCategories.trackRepair },
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
