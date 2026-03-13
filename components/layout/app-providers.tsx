"use client";

import { Suspense } from "react";
import { Toaster } from "sonner";

import { AffiliateTracker } from "@/components/analytics/affiliate-tracker";
import { CartDrawer } from "@/components/commerce/cart-drawer";
import { CartProvider } from "@/components/commerce/cart-provider";
import { WishlistProvider } from "@/components/commerce/wishlist-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Suspense fallback={null}>
          <AffiliateTracker />
        </Suspense>
        {children}
        <CartDrawer />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#faf8f4",
              border: "1px solid rgba(44,44,44,0.12)",
              color: "#3a3530",
              fontFamily: "inherit",
              fontSize: "0.875rem",
            },
          }}
        />
      </WishlistProvider>
    </CartProvider>
  );
}
