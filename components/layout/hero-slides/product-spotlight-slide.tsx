import Image from "next/image";
import Link from "next/link";

import type { HeroSlide } from "@/types/hero";

interface ProductSpotlightSlideProps {
  slide: HeroSlide;
  isFirst: boolean;
}

export function ProductSpotlightSlide({ slide, isFirst }: ProductSpotlightSlideProps) {
  const product = slide.product;

  if (!product) {
    return null;
  }

  const ctaHref = slide.ctaHref ?? `/products/${product.slug}`;
  const ctaLabel = slide.ctaLabel ?? "View Product";

  return (
    <div className="hero-slide-frame grid gap-8 overflow-hidden lg:grid-cols-2 lg:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-md lg:mx-0">
        <Image
          src={product.primaryImageUrl ?? "/placeholders/product-default.svg"}
          alt={product.primaryImageAlt ?? product.title}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 80vw, 40vw"
          priority={isFirst}
        />
      </div>
      <div className="min-w-0 space-y-4 text-center lg:text-left">
        <p className="premium-eyebrow">{product.brand}</p>
        {slide.headline ? (
          <h2 className="break-words text-4xl text-graphite sm:text-6xl">{slide.headline}</h2>
        ) : (
          <h2 className="break-words text-4xl text-graphite sm:text-6xl">{product.title}</h2>
        )}
        {slide.subheadline && (
          <p className="max-w-xl text-lg text-graphite/79">{slide.subheadline}</p>
        )}
        <p className="text-2xl text-walnut">
          {product.price.toFixed(2)} {product.currency}
        </p>
        <Link
          href={ctaHref}
          className="inline-flex h-11 items-center rounded-full bg-walnut/92 px-6 text-sm font-medium text-white transition hover:bg-walnut"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
