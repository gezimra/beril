"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/commerce/cart-provider";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEur } from "@/lib/utils/money";
import { getProductImageUrl } from "@/lib/utils/product-image";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } =
    useCart();

  const deliveryEstimate = itemCount > 0 ? "2-4 dite pune" : "-";

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="premium">Shporta</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Shporta Juaj</h1>
          <p className="text-sm text-graphite/75 sm:text-base">
            Rishiko produktet e zgjedhura para porosise.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="surface-panel p-8">
            <p className="text-sm text-graphite/74">
              Shporta eshte bosh. Shfleto oret dhe syzet per te shtuar produkte.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/watches"
                className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
              >
                Shfleto Oret
              </Link>
              <Link
                href="/eyewear"
                className="inline-flex h-11 items-center rounded-full border border-graphite/20 bg-white/75 px-5 text-sm font-medium text-graphite"
              >
                Shfleto Syzet
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
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-graphite/18 bg-white/80 text-sm"
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
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-graphite/18 bg-white/80 text-sm"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="ml-2 text-xs uppercase tracking-[0.12em] text-graphite/62 hover:text-graphite"
                          >
                            Largo
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="surface-panel h-fit p-5">
              <h2 className="text-2xl text-graphite">Permbledhje</h2>
              <dl className="mt-4 space-y-2 text-sm text-graphite/78">
                <div className="flex items-center justify-between">
                  <dt>Artikuj</dt>
                  <dd>{itemCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Nentotali</dt>
                  <dd>{formatEur(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Koha e dergeses</dt>
                  <dd>{deliveryEstimate}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
              >
                Vazhdo ne Pagese
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full border border-graphite/18 bg-white/75 px-5 text-xs uppercase tracking-[0.12em] text-graphite"
              >
                Pastro Shporten
              </button>
            </aside>
          </div>
        )}
      </Container>
    </SectionWrapper>
  );
}
