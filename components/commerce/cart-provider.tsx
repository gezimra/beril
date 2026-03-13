"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CartItem } from "@/types/cart";

const CART_STORAGE_KEY = "beril_cart_v1";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadStoredCart() {
  if (typeof window === "undefined") {
    return [] as CartItem[];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [] as CartItem[];
    }

    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [] as CartItem[];
    }

    return parsed;
  } catch {
    return [] as CartItem[];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasHydratedStorage) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setItems(loadStoredCart());
      setHasHydratedStorage(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hasHydratedStorage]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedStorage) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasHydratedStorage, items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotal,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      addItem: (item) => {
        startTransition(() => {
          setItems((currentItems) => {
            const existingItem = currentItems.find(
              (entry) => entry.productId === item.productId,
            );

            if (!existingItem) {
              return [...currentItems, item];
            }

            return currentItems.map((entry) =>
              entry.productId === item.productId
                ? { ...entry, quantity: Math.min(10, entry.quantity + item.quantity) }
                : entry,
            );
          });
        });
      },
      updateQuantity: (productId, quantity) => {
        startTransition(() => {
          setItems((currentItems) =>
            currentItems.map((entry) =>
              entry.productId === productId
                ? { ...entry, quantity: Math.max(1, Math.min(10, quantity)) }
                : entry,
            ),
          );
        });
      },
      removeItem: (productId) => {
        startTransition(() => {
          setItems((currentItems) =>
            currentItems.filter((entry) => entry.productId !== productId),
          );
        });
      },
      clearCart: () => {
        startTransition(() => {
          setItems([]);
        });
      },
    };
  }, [items, isCartOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
