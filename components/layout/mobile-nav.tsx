"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/types/navigation";

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => {
    startTransition(() => setIsOpen(true));
  };

  const closeMenu = () => {
    startTransition(() => setIsOpen(false));
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation menu"
        onClick={openMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] bg-graphite/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          >
            <motion.aside
              className="ml-auto flex h-full w-[82vw] max-w-sm flex-col border-l border-graphite/10 bg-ivory p-6"
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
                  aria-label="Close navigation menu"
                  onClick={closeMenu}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex flex-col gap-3">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="rounded-xl border border-transparent px-3 py-2 text-sm uppercase tracking-[0.12em] text-graphite/85 transition hover:border-graphite/15 hover:bg-white/75"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-8">
                <Link
                  href="/service/request"
                  onClick={closeMenu}
                  className="inline-flex h-11 w-full items-center justify-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
                >
                  Book Service
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
