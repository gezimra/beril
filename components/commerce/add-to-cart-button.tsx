"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/commerce/cart-provider";
import { trackEvent } from "@/lib/analytics/track";
import type { CartItem } from "@/types/cart";

interface AddToCartButtonProps {
  item: CartItem;
  disabled?: boolean;
  label: string;
}

export function AddToCartButton({ item, disabled = false, label }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem(item);
        trackEvent("add_to_cart", {
          route: `/products/${item.slug}`,
          productId: item.productId,
          productSlug: item.slug,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
        setIsAdded(true);

        window.setTimeout(() => {
          setIsAdded(false);
        }, 1200);
      }}
      className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
    >
      {isAdded ? "Added" : label}
    </button>
  );
}

export function GoToCartButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          router.push("/cart");
        });
      }}
      className="inline-flex h-11 items-center rounded-full border border-graphite/20 bg-white/75 px-6 text-sm font-medium text-graphite"
    >
      View Cart
    </button>
  );
}
