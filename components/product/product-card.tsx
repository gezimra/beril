import Image from "next/image";
import Link from "next/link";

import { ProductBadge } from "@/components/product/product-badge";
import { formatEur } from "@/lib/utils/money";
import { primaryCtaLabel, stockStatusLabel } from "@/lib/utils/product";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  movementLabel?: string | null;
}

export function ProductCard({ product, movementLabel }: ProductCardProps) {
  const image = product.images[0];

  return (
    <article className="surface-panel overflow-hidden p-3">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-graphite/10 bg-stone/40">
          <Image
            src={image?.url ?? "/placeholders/product-default.svg"}
            alt={image?.alt ?? product.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 20vw"
            className="object-cover transition duration-300 hover:scale-[1.02]"
          />
        </div>
      </Link>

      <div className="mt-4 space-y-2 px-1 pb-2">
        <p className="text-xs uppercase tracking-[0.16em] text-graphite/62">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 text-xl text-graphite">{product.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {movementLabel ? (
            <ProductBadge type="movement" value={movementLabel} />
          ) : null}
          {product.isNew ? <ProductBadge type="new" value="New" /> : null}
          <ProductBadge
            type="stock"
            value={stockStatusLabel(product.stockStatus)}
            stockStatus={product.stockStatus}
          />
        </div>
        <p className="text-lg font-medium text-graphite">{formatEur(product.price)}</p>
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex h-10 items-center rounded-full border border-graphite/18 bg-white/80 px-4 text-xs uppercase tracking-[0.12em] text-graphite transition hover:bg-white"
        >
          {primaryCtaLabel(product)}
        </Link>
      </div>
    </article>
  );
}
