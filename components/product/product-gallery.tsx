"use client";

import Image from "next/image";
import { useState } from "react";

import { getProductImageUrl } from "@/lib/utils/product-image";
import type { ProductCategory } from "@/types/domain";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  productBrand: string;
  productCategory: ProductCategory;
  productTitle: string;
}

const placeholderImage = {
  id: "placeholder",
  productId: "placeholder",
  url: "/placeholders/product-default.svg",
  alt: "Product image",
  sortOrder: 1,
} satisfies ProductImage;

export function ProductGallery({
  images,
  productBrand,
  productCategory,
  productTitle,
}: ProductGalleryProps) {
  const galleryImages = images.length > 0 ? images : [placeholderImage];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];
  const activeImageUrl = getProductImageUrl({
    imageUrl: activeImage.url,
    brand: productBrand,
    title: productTitle,
    category: productCategory,
  });

  return (
    <div className="surface-panel space-y-3 p-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-graphite/10 bg-stone/40">
        <Image
          src={activeImageUrl}
          alt={activeImage.alt || productTitle}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
        />
      </div>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border ${
                index === activeIndex
                  ? "border-walnut"
                  : "border-graphite/15"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-walnut/40`}
              aria-label={`View image ${index + 1} for ${productTitle}`}
            >
              <Image
                src={getProductImageUrl({
                  imageUrl: image.url,
                  brand: productBrand,
                  title: productTitle,
                  category: productCategory,
                })}
                alt={image.alt || productTitle}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
