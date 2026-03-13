"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { useCart } from "@/components/commerce/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentLocale, getMessages } from "@/lib/i18n";
import { formatEur } from "@/lib/utils/money";
import { getProductImageUrl } from "@/lib/utils/product-image";

export function CartDrawer() {
  const { items, subtotal, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const messages = getMessages(getCurrentLocale());
  const t = messages.cart;

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={[
          "fixed inset-0 z-50 bg-graphite/20 backdrop-blur-[2px] transition-opacity duration-300",
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.drawerTitle}
        className={[
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-ivory shadow-2xl transition-transform duration-300",
          isCartOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-graphite/10 px-5 py-4">
          <h2 className="text-lg text-graphite">{t.drawerTitle}</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-graphite/15 bg-white/80 text-graphite/70 transition hover:bg-white hover:text-graphite"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-graphite/25" />
            <p className="text-sm text-graphite/60">{t.empty}</p>
            <div className="flex w-full flex-col gap-2">
              <Link href="/watches" onClick={closeCart} className={buttonVariants({ variant: "primary", className: "w-full h-10" })}>
                {t.browseWatches}
              </Link>
              <Link href="/eyewear" onClick={closeCart} className={buttonVariants({ variant: "secondary", className: "w-full h-10" })}>
                {t.browseEyewear}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {items.map((item) => {
                const imageUrl = getProductImageUrl({
                  imageUrl: item.imageUrl,
                  brand: item.brand,
                  title: item.title,
                  category: item.category,
                });

                return (
                  <li
                    key={item.productId}
                    className="flex gap-3 rounded-xl border border-graphite/8 bg-white/60 p-3"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-graphite/10 bg-stone/40"
                    >
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-[0.6rem] uppercase tracking-[0.12em] text-graphite/55">
                        {item.brand}
                      </p>
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="truncate text-sm text-graphite hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs font-medium text-graphite">
                        {formatEur(item.unitPrice)}
                      </p>
                      <div className="mt-auto flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-graphite/18 bg-white/80 text-xs transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="inline-flex h-6 min-w-7 items-center justify-center rounded-full border border-graphite/12 bg-stone/45 px-2 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-graphite/18 bg-white/80 text-xs transition hover:bg-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto text-[0.6rem] uppercase tracking-[0.1em] text-graphite/50 transition hover:text-graphite"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-2.5 border-t border-graphite/10 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-graphite/70">{t.subtotal}</span>
                <span className="font-medium text-graphite">{formatEur(subtotal)}</span>
              </div>
              <Link href="/checkout" onClick={closeCart} className={buttonVariants({ variant: "primary", className: "w-full" })}>
                {t.checkout}
              </Link>
              <Link href="/cart" onClick={closeCart} className={buttonVariants({ variant: "secondary", className: "w-full text-xs uppercase tracking-[0.1em]" })}>
                {t.viewFullCart}
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
