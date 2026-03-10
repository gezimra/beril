"use client";

import { Suspense } from "react";

import { AffiliateTracker } from "@/components/analytics/affiliate-tracker";
import { CartProvider } from "@/components/commerce/cart-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      {children}
    </CartProvider>
  );
}
