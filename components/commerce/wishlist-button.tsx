"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useWishlist } from "@/components/commerce/wishlist-provider";
import { getCurrentLocale, getMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { WishlistItem } from "@/types/wishlist";

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ item, className, size = "sm" }: WishlistButtonProps) {
  const { isInWishlist, toggleItem } = useWishlist();
  const saved = isInWishlist(item.productId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(item);
        const t = getMessages(getCurrentLocale()).wishlist;
        toast(saved ? t.toastRemoved : t.toastAdded, { duration: 1800 });
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition",
        size === "sm"
          ? "h-8 w-8 border-graphite/15 bg-white/80 hover:bg-white"
          : "h-10 w-10 border-graphite/18 bg-white/80 hover:bg-white",
        saved && "border-walnut/30 bg-walnut/8",
        className,
      )}
    >
      <Heart
        className={cn(
          "transition-colors",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          saved ? "fill-walnut text-walnut" : "text-graphite/55",
        )}
      />
    </button>
  );
}
