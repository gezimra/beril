import type { Product } from "@/types/product";
import type { SiteSettings } from "@/types/site-settings";
import type { AdminJournalPost } from "@/types/admin";

export function localBusinessJsonLd(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "BERIL",
    image: "/placeholders/product-default.svg",
    telephone: settings.storePhone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.storeAddress,
      addressLocality: "Gjilan",
      addressCountry: "XK",
    },
    openingHours: settings.storeHours,
    url: "https://beril.store",
    areaServed: "Kosovo",
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; item: string; position: number }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry) => ({
      "@type": "ListItem",
      position: entry.position,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.title}`,
    image: product.images.map((image) => image.url),
    description: product.shortDescription,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price,
      availability:
        product.stockStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
}

export function articleJsonLd(post: AdminJournalPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "BERIL",
    },
    publisher: {
      "@type": "Organization",
      name: "BERIL",
    },
  };
}
