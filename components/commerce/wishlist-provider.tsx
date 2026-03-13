"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { WishlistItem } from "@/types/wishlist";

const WISHLIST_STORAGE_KEY = "beril_wishlist_v1";

interface WishlistContextValue {
  items: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function loadStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WishlistItem[];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const frame = window.requestAnimationFrame(() => {
      setItems(loadStoredWishlist());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      isInWishlist: (productId) => items.some((i) => i.productId === productId),
      addItem: (item) => {
        startTransition(() => {
          setItems((prev) =>
            prev.some((i) => i.productId === item.productId) ? prev : [...prev, item],
          );
        });
      },
      removeItem: (productId) => {
        startTransition(() => {
          setItems((prev) => prev.filter((i) => i.productId !== productId));
        });
      },
      toggleItem: (item) => {
        startTransition(() => {
          setItems((prev) =>
            prev.some((i) => i.productId === item.productId)
              ? prev.filter((i) => i.productId !== item.productId)
              : [...prev, item],
          );
        });
      },
    }),
    [items],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider.");
  }
  return context;
}
