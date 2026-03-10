import type { Product } from "@/types/product";
import type { SiteSettings } from "@/types/site-settings";
import type { AdminJournalPost } from "@/types/admin";
import { env } from "@/lib/env";

function toAbsoluteUrl(urlOrPath: string) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }
  const base = env.client.siteUrl.replace(/\/+$/, "");
  const suffix = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${base}${suffix}`;
}

export function localBusinessJsonLd(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.businessName,
    image: toAbsoluteUrl(settings.defaultSeoImage),
    telephone: settings.storePhone,
    email: settings.storeEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.storeAddress,
      addressLocality: "Gjilan",
      addressCountry: "XK",
    },
    openingHours: settings.storeHours,
    url: toAbsoluteUrl("/"),
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
    image: product.images.map((image) => toAbsoluteUrl(image.url)),
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
    image: post.coverImage ? [toAbsoluteUrl(post.coverImage)] : [],
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
