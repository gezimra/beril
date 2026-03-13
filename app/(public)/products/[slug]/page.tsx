import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import {
  AddToCartButton,
  GoToCartButton,
} from "@/components/commerce/add-to-cart-button";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { EventOnView } from "@/components/analytics/event-on-view";
import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAllActiveProducts,
  getMovementLabel,
  getProductBySlug,
  getRelatedProducts,
  groupSpecsForDisplay,
} from "@/lib/db/catalog";
import { env } from "@/lib/env";
import { getServerMessages } from "@/lib/i18n/server";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/structured-data";
import { siteConfig } from "@/lib/site";
import { formatEur } from "@/lib/utils/money";
import { getProductImageUrl } from "@/lib/utils/product-image";
import { primaryCtaLabel, stockStatusLabel } from "@/lib/utils/product";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = env.client.siteUrl.replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, messages] = await Promise.all([
    getProductBySlug(slug),
    getServerMessages(),
  ]);

  if (!product) {
    return {
      title: messages.productPage.notFound,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${product.brand} ${product.title}`,
    description: product.shortDescription,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.brand} ${product.title}`,
      description: product.shortDescription,
      images: [
        {
          url: product.images[0]?.url ?? "/placeholders/product-default.svg",
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const [product, messages] = await Promise.all([
    getProductBySlug(slug),
    getServerMessages(),
  ]);

  if (!product) {
    notFound();
  }

  const [allProducts] = await Promise.all([getAllActiveProducts()]);
  const relatedProducts = getRelatedProducts(allProducts, product, 4);
  const specs = groupSpecsForDisplay(product);
  const movement = getMovementLabel(product);
  const canAddToCart =
    product.primaryCtaMode === "add_to_cart" &&
    (product.stockStatus === "in_stock" || product.stockStatus === "limited");

  const productLd = productJsonLd(product);
  const breadcrumbLd = breadcrumbJsonLd([
    { position: 1, name: messages.productPage.home, item: `${siteUrl}/` },
    {
      position: 2,
      name:
        product.category === "watch"
          ? messages.productPage.watches
          : messages.productPage.eyewear,
      item:
        product.category === "watch"
          ? `${siteUrl}/watches`
          : `${siteUrl}/eyewear`,
    },
    {
      position: 3,
      name: `${product.brand} ${product.title}`,
      item: `${siteUrl}/products/${product.slug}`,
    },
  ]);

  const primaryImageUrl = getProductImageUrl({
    imageUrl: product.images[0]?.url,
    brand: product.brand,
    title: product.title,
    category: product.category,
  });

  return (
    <>
      <Script id={`product-jsonld-${product.id}`} type="application/ld+json">
        {JSON.stringify(productLd)}
      </Script>
      <Script id={`product-breadcrumb-${product.id}`} type="application/ld+json">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <EventOnView
        name="product_view"
        payload={{
          route: `/products/${product.slug}`,
          source: "product_page",
          productId: product.id,
          productSlug: product.slug,
          category: product.category,
          price: product.price,
        }}
      />

      <SectionWrapper className="py-16">
        <Container className="space-y-12">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-graphite/55">
            <Link href="/" className="hover:text-graphite transition-colors">
              {messages.productPage.home}
            </Link>
            <span>/</span>
            <Link
              href={product.category === "watch" ? "/watches" : "/eyewear"}
              className="hover:text-graphite transition-colors"
            >
              {product.category === "watch" ? messages.productPage.watches : messages.productPage.eyewear}
            </Link>
            <span>/</span>
            <span className="text-graphite/80 line-clamp-1">{product.brand} {product.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <ProductGallery
              images={product.images}
              productBrand={product.brand}
              productCategory={product.category}
              productTitle={product.title}
            />

            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.16em] text-graphite/62">
                {product.brand} | {product.category}
              </p>
              <h1 className="text-5xl leading-tight text-graphite sm:text-6xl">
                {product.title}
              </h1>
              <p className="text-sm text-graphite/75">{product.shortDescription}</p>
              <div className="flex flex-wrap gap-2">
                {movement ? (
                  <StatusBadge tone="neutral">{movement}</StatusBadge>
                ) : null}
                {product.isNew ? <StatusBadge tone="premium">{messages.productPage.newBadge}</StatusBadge> : null}
                <StatusBadge tone="service">
                  {stockStatusLabel(product.stockStatus, messages.productPage)}
                </StatusBadge>
              </div>
              <p className="text-3xl font-medium text-graphite">
                {formatEur(product.price)}
              </p>
              <div className="flex flex-wrap gap-3">
                {canAddToCart ? (
                  <AddToCartButton
                    label={primaryCtaLabel(product, messages.productPage)}
                    item={{
                      productId: product.id,
                      slug: product.slug,
                      title: product.title,
                      brand: product.brand,
                      category: product.category,
                      imageUrl: primaryImageUrl,
                      unitPrice: product.price,
                      quantity: 1,
                      stockStatus: product.stockStatus,
                      ctaMode: product.primaryCtaMode,
                    }}
                  />
                ) : (
                  <TrackedExternalLink
                    href={siteConfig.whatsappHref}
                    eventName="click_whatsapp"
                    payload={{
                      route: `/products/${product.slug}`,
                      source: "product_primary_cta",
                      destination: siteConfig.whatsappHref,
                    }}
                    className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white"
                  >
                    {primaryCtaLabel(product, messages.productPage)}
                  </TrackedExternalLink>
                )}
                <GoToCartButton />
                <WishlistButton
                  size="md"
                  item={{
                    productId: product.id,
                    slug: product.slug,
                    title: product.title,
                    brand: product.brand,
                    category: product.category,
                    imageUrl: primaryImageUrl,
                    price: product.price,
                    stockStatus: product.stockStatus,
                  }}
                />
                <TrackedExternalLink
                  href={siteConfig.whatsappHref}
                  eventName="click_whatsapp"
                  payload={{
                    route: `/products/${product.slug}`,
                    source: "product_secondary_cta",
                    destination: siteConfig.whatsappHref,
                  }}
                  className="inline-flex h-11 items-center rounded-full border border-mineral/35 bg-mineral/12 px-6 text-sm font-medium text-mineral"
                >
                  {messages.productPage.inquireWhatsapp}
                </TrackedExternalLink>
              </div>
              <p className="text-xs text-graphite/62">
                {messages.productPage.paymentNote}
              </p>
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className="surface-panel p-7">
              <h2 className="text-3xl text-graphite">{messages.productPage.details}</h2>
              <p className="mt-3 text-sm leading-7 text-graphite/76">
                {product.description}
              </p>
            </article>
            <article className="surface-panel p-7">
              <h2 className="text-3xl text-graphite">{messages.productPage.specs}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-center justify-between rounded-lg border border-graphite/10 bg-white/75 px-3 py-2"
                  >
                    <dt className="uppercase tracking-[0.08em] text-graphite/65">
                      {spec.key.replaceAll("_", " ")}
                    </dt>
                    <dd className="font-medium text-graphite">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl text-graphite">{messages.productPage.related}</h2>
              <Link
                href={product.category === "watch" ? "/watches" : "/eyewear"}
                className="text-xs uppercase tracking-[0.14em] text-graphite/70"
              >
                {messages.productPage.viewCategory}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  movementLabel={getMovementLabel(relatedProduct)}
                  messages={messages.productPage}
                />
              ))}
            </div>
          </div>
        </Container>
      </SectionWrapper>
    </>
  );
}
