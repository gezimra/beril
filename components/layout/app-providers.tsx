"use client";

import { CartProvider } from "@/components/commerce/cart-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
