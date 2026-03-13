import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { ProductBadge } from "@/components/product/product-badge";
import { getProductImageUrl } from "@/lib/utils/product-image";
import { formatEur } from "@/lib/utils/money";
import { primaryCtaLabel, stockStatusLabel } from "@/lib/utils/product";
import type { Product } from "@/types/product";

type ProductCardMessages = {
  newBadge: string;
  stockInStock: string;
  stockLimited: string;
  stockAvailableOnRequest: string;
  stockOutOfStock: string;
  ctaAddToCart: string;
  ctaReserveInStore: string;
  ctaInquireWhatsapp: string;
  ctaRequestAvailability: string;
  ctaViewDetails: string;
};

interface ProductCardProps {
  product: Product;
  movementLabel?: string | null;
  messages?: ProductCardMessages;
}

export function ProductCard({ product, movementLabel, messages }: ProductCardProps) {
  const image = product.images[0];
  const imageUrl = getProductImageUrl({
    imageUrl: image?.url,
    brand: product.brand,
    title: product.title,
    category: product.category,
  });
  const canAddToCart =
    product.primaryCtaMode === "add_to_cart" &&
    (product.stockStatus === "in_stock" || product.stockStatus === "limited");

  return (
    <article className="surface-panel overflow-hidden p-2.5 sm:p-3">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-graphite/10 bg-stone/40">
          <Image
            src={imageUrl}
            alt={image?.alt ?? product.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 20vw"
            className="object-cover transition duration-300 hover:scale-[1.04]"
          />
          <div className="absolute right-2 top-2">
            <WishlistButton
              item={{
                productId: product.id,
                slug: product.slug,
                title: product.title,
                brand: product.brand,
                category: product.category,
                imageUrl,
                price: product.price,
                stockStatus: product.stockStatus,
              }}
            />
          </div>
        </div>
      </Link>

      <div className="mt-3 space-y-1.5 px-0.5 pb-1.5 sm:mt-4 sm:space-y-2 sm:px-1 sm:pb-2">
        <Link href={`/products/${product.slug}`} className="block space-y-1.5 sm:space-y-2">
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-graphite/62 sm:text-xs sm:tracking-[0.16em]">
            {product.brand}
          </p>
          <h3 className="line-clamp-2 text-lg leading-snug text-graphite sm:text-xl">
            {product.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {movementLabel ? (
              <ProductBadge type="movement" value={movementLabel} />
            ) : null}
            {product.isNew ? (
              <ProductBadge type="new" value={messages?.newBadge ?? "New"} />
            ) : null}
            <ProductBadge
              type="stock"
              value={stockStatusLabel(product.stockStatus, messages)}
              stockStatus={product.stockStatus}
            />
          </div>
          <p className="text-base font-medium text-graphite sm:text-lg">
            {formatEur(product.price)}
          </p>
        </Link>
        {canAddToCart ? (
          <AddToCartButton
            compact
            label={primaryCtaLabel(product, messages)}
            item={{
              productId: product.id,
              slug: product.slug,
              title: product.title,
              brand: product.brand,
              category: product.category,
              imageUrl,
              unitPrice: product.price,
              quantity: 1,
              stockStatus: product.stockStatus,
              ctaMode: product.primaryCtaMode,
            }}
          />
        ) : (
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/80 px-3 text-[0.62rem] uppercase tracking-[0.1em] text-graphite transition hover:bg-white sm:h-10 sm:px-4 sm:text-xs sm:tracking-[0.12em]"
          >
            {primaryCtaLabel(product, messages)}
          </Link>
        )}
      </div>
    </article>
  );
}
