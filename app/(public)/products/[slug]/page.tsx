import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import Script from "next/script";

import {
  AddToCartButton,
  GoToCartButton,
} from "@/components/commerce/add-to-cart-button";
import { EventOnView } from "@/components/analytics/event-on-view";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAllActiveProducts,
  getMovementLabel,
  getProductBySlug,
  getRelatedProducts,
  groupSpecsForDisplay,
} from "@/lib/db/catalog";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/structured-data";
import { formatEur } from "@/lib/utils/money";
import { primaryCtaLabel, stockStatusLabel } from "@/lib/utils/product";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.brand} ${product.title}`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

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
    { position: 1, name: "Home", item: "https://beril.store/" },
    {
      position: 2,
      name: product.category === "watch" ? "Watches" : "Eyewear",
      item:
        product.category === "watch"
          ? "https://beril.store/watches"
          : "https://beril.store/eyewear",
    },
    {
      position: 3,
      name: `${product.brand} ${product.title}`,
      item: `https://beril.store/products/${product.slug}`,
    },
  ]);

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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="surface-panel p-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-graphite/10 bg-stone/40">
              <Image
                src={product.images[0]?.url ?? "/placeholders/product-default.svg"}
                alt={product.images[0]?.alt ?? product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.16em] text-graphite/62">
              {product.brand} | {product.category}
            </p>
            <h1 className="text-5xl leading-tight text-graphite sm:text-6xl">
              {product.title}
            </h1>
            <p className="text-sm text-graphite/75">{product.shortDescription}</p>
            <div className="flex flex-wrap gap-2">
              {movement ? <StatusBadge tone="neutral">{movement}</StatusBadge> : null}
              {product.isNew ? <StatusBadge tone="premium">New</StatusBadge> : null}
              <StatusBadge tone="service">
                {stockStatusLabel(product.stockStatus)}
              </StatusBadge>
            </div>
            <p className="text-3xl font-medium text-graphite">{formatEur(product.price)}</p>
            <div className="flex flex-wrap gap-3">
              {canAddToCart ? (
                <AddToCartButton
                  label={primaryCtaLabel(product)}
                  item={{
                    productId: product.id,
                    slug: product.slug,
                    title: product.title,
                    brand: product.brand,
                    category: product.category,
                    imageUrl:
                      product.images[0]?.url ?? "/placeholders/product-default.svg",
                    unitPrice: product.price,
                    quantity: 1,
                    stockStatus: product.stockStatus,
                    ctaMode: product.primaryCtaMode,
                  }}
                />
              ) : (
                <a
                  href="https://wa.me/38344000000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white"
                >
                  {primaryCtaLabel(product)}
                </a>
              )}
              <GoToCartButton />
              <a
                href="https://wa.me/38344000000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-full border border-mineral/35 bg-mineral/12 px-6 text-sm font-medium text-mineral"
              >
                Inquire on WhatsApp
              </a>
            </div>
            <p className="text-xs text-graphite/62">
              Payment is completed on delivery or when you collect your order in
              store.
            </p>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">Product Details</h2>
            <p className="mt-3 text-sm leading-7 text-graphite/76">
              {product.description}
            </p>
          </article>
          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">Specifications</h2>
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
            <h2 className="text-4xl text-graphite">Related Products</h2>
            <Link
              href={product.category === "watch" ? "/watches" : "/eyewear"}
              className="text-xs uppercase tracking-[0.14em] text-graphite/70"
            >
              View Category
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                movementLabel={getMovementLabel(relatedProduct)}
              />
            ))}
          </div>
        </div>
        </Container>
      </SectionWrapper>
    </>
  );
}
