"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface SearchDrawerProps {
  compact?: boolean;
}

export function SearchDrawer({ compact = false }: SearchDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canUseDom = typeof document !== "undefined";

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

  const openDrawer = () => {
    startTransition(() => setIsOpen(true));
  };

  const closeDrawer = () => {
    startTransition(() => setIsOpen(false));
  };

  return (
    <>
      <Button
        aria-label="Search products"
        variant="ghost"
        size={compact ? "icon" : "default"}
        className={compact ? "h-10 w-10" : "h-10"}
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
                      <p className="text-xs uppercase tracking-[0.22em] text-graphite/60">
                        Search
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
                    <input
                      id="search-input"
                      type="search"
                      placeholder="Search watches, eyewear, or service..."
                      className="w-full rounded-xl border border-graphite/15 bg-white/85 px-4 py-3 text-sm text-graphite outline-none transition focus:border-gold"
                    />
                    <p className="mt-3 text-xs text-graphite/65">
                      Search is being refined and will be connected to live catalog results
                      shortly.
                    </p>
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
