"use client";

import { Minus, Plus } from "lucide-react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/commerce/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/track";
import type { CartItem } from "@/types/cart";

interface AddToCartButtonProps {
  item: CartItem;
  disabled?: boolean;
  label: string;
  compact?: boolean;
}

export function AddToCartButton({
  item,
  disabled = false,
  label,
  compact = false,
}: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, openCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const existingItem = items.find((entry) => entry.productId === item.productId);
  const currentQuantity = existingItem?.quantity ?? 0;

  const sizeClass = compact ? "h-9 text-xs px-4" : "h-11 text-sm px-6";
  const qtyButtonSize = compact ? "h-9 w-9" : "h-10 w-10";
  const qtyTextClass = compact ? "text-xs" : "text-sm";

  if (currentQuantity > 0) {
    return (
      <div className="space-y-1">
        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-mineral/85 sm:text-[0.68rem]">
          In Cart: {currentQuantity}
        </p>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            aria-label={`Decrease ${item.title} quantity`}
            disabled={currentQuantity <= 1}
            onClick={() =>
              updateQuantity(item.productId, Math.max(1, currentQuantity - 1))
            }
            className={`inline-flex ${qtyButtonSize} cursor-pointer items-center justify-center rounded-full border border-graphite/18 bg-white/90 text-graphite transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className={`inline-flex h-9 min-w-12 items-center justify-center rounded-full border border-mineral/25 bg-mineral/10 px-3 font-medium text-mineral ${qtyTextClass}`}
          >
            {currentQuantity}
          </span>
          <button
            type="button"
            aria-label={`Increase ${item.title} quantity`}
            onClick={() =>
              updateQuantity(item.productId, Math.min(10, currentQuantity + 1))
            }
            className={`inline-flex ${qtyButtonSize} cursor-pointer items-center justify-center rounded-full border border-graphite/18 bg-white/90 text-graphite transition hover:bg-white`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem(item);
        openCart();
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
      className={buttonVariants({ variant: "primary", className: `${sizeClass} disabled:cursor-not-allowed disabled:opacity-45` })}
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
      className={buttonVariants({ variant: "secondary", className: "px-6" })}
    >
      View Cart
    </button>
  );
}
