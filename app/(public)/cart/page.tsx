"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/commerce/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentLocale, getMessages } from "@/lib/i18n";
import { formatEur } from "@/lib/utils/money";
import { getProductImageUrl } from "@/lib/utils/product-image";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const messages = getMessages(getCurrentLocale());
  const t = messages.cart;

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="premium">{t.badge}</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">{t.title}</h1>
          <p className="text-sm text-graphite/75 sm:text-base">{t.subtitle}</p>
        </header>

        {items.length === 0 ? (
          <div className="surface-panel p-8">
            <p className="text-sm text-graphite/74">{t.empty}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/watches" className={buttonVariants({ variant: "primary" })}>
                {t.browseWatches}
              </Link>
              <Link href="/eyewear" className={buttonVariants({ variant: "secondary" })}>
                {t.browseEyewear}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="space-y-4">
              {items.map((item) => {
                const imageUrl = getProductImageUrl({
                  imageUrl: item.imageUrl,
                  brand: item.brand,
                  title: item.title,
                  category: item.category,
                });

                return (
                  <article key={item.productId} className="surface-panel p-4">
                    <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-graphite/10 bg-stone/40">
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
                            {item.brand}
                          </p>
                          <h2 className="text-2xl text-graphite">{item.title}</h2>
                          <p className="mt-1 text-sm text-graphite/75">
                            {formatEur(item.unitPrice)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-graphite/18 bg-white/80 text-sm transition hover:bg-white hover:shadow-sm"
                          >
                            -
                          </button>
                          <span className="inline-flex h-9 min-w-11 items-center justify-center rounded-full border border-graphite/12 bg-stone/45 px-3 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-graphite/18 bg-white/80 text-sm transition hover:bg-white hover:shadow-sm"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="ml-2 text-xs uppercase tracking-[0.12em] text-graphite/62 hover:text-graphite"
                          >
                            {t.remove}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="surface-panel h-fit p-5">
              <h2 className="text-2xl text-graphite">{t.summaryTitle}</h2>
              <dl className="mt-4 space-y-2 text-sm text-graphite/78">
                <div className="flex items-center justify-between">
                  <dt>{t.items}</dt>
                  <dd>{itemCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>{t.subtotal}</dt>
                  <dd>{formatEur(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>{t.deliveryEstimate}</dt>
                  <dd>{itemCount > 0 ? t.deliveryDays : "-"}</dd>
                </div>
              </dl>
              <Link href="/checkout" className={buttonVariants({ variant: "primary", className: "mt-5 w-full" })}>
                {t.checkout}
              </Link>
              <Button
                variant="secondary"
                onClick={clearCart}
                className="mt-2 w-full text-xs uppercase tracking-[0.12em]"
              >
                {t.clearCart}
              </Button>
              <div className="mt-4 border-t border-graphite/10 pt-4">
                <Link
                  href="/watches"
                  className="text-xs uppercase tracking-[0.12em] text-graphite/60 transition hover:text-graphite"
                >
                  ← {t.continueShopping}
                </Link>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </SectionWrapper>
  );
}
