"use client";

import Image from "next/image";
import Link from "next/link";

import { useWishlist } from "@/components/commerce/wishlist-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEur } from "@/lib/utils/money";
import { getProductImageUrl } from "@/lib/utils/product-image";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="premium">Produkte te Ruajtura</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Lista e Deshirave</h1>
          <p className="text-sm text-graphite/75 sm:text-base">
            {items.length > 0
              ? `${items.length} produkte te ruajtura`
              : "Ruaj produktet qe te interesojne per t'i gjetur me lehte me vone."}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="surface-panel p-8">
            <p className="text-sm text-graphite/74">
              Lista e deshirave eshte bosh. Shfleto oret dhe syzet per te ruajtur produkte.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/watches" className={buttonVariants({ variant: "primary" })}>
                Shfleto Oret
              </Link>
              <Link href="/eyewear" className={buttonVariants({ variant: "secondary" })}>
                Shfleto Syzet
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const imageUrl = getProductImageUrl({
                imageUrl: item.imageUrl,
                brand: item.brand,
                title: item.title,
                category: item.category,
              });

              return (
                <article key={item.productId} className="surface-panel overflow-hidden p-2.5 sm:p-3">
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-graphite/10 bg-stone/40">
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    </div>
                  </Link>
                  <div className="mt-3 space-y-1.5 px-0.5 pb-1.5 sm:mt-4 sm:px-1 sm:pb-2">
                    <Link href={`/products/${item.slug}`} className="block space-y-1">
                      <p className="text-[0.62rem] uppercase tracking-[0.14em] text-graphite/62 sm:text-xs sm:tracking-[0.16em]">
                        {item.brand}
                      </p>
                      <h3 className="line-clamp-2 text-lg leading-snug text-graphite sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="text-base font-medium text-graphite sm:text-lg">
                        {formatEur(item.price)}
                      </p>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      className="mt-2 text-[0.62rem] uppercase tracking-[0.1em] sm:h-10 sm:px-4 sm:text-xs sm:tracking-[0.12em]"
                    >
                      Hiq nga lista
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </SectionWrapper>
  );
}
