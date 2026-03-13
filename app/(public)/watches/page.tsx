import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { WatchFilters } from "@/components/catalog/watch-filters";
import {
  getCatalogFilterOptions,
  getMovementLabel,
  listCatalogProducts,
  type WatchCatalogFilterOptions,
} from "@/lib/db/catalog";
import {
  buildSearchParams,
  parseCatalogSearchParams,
} from "@/lib/validations/catalog-query";
import { getServerMessages } from "@/lib/i18n/server";

type WatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Watches in Gjilan",
  description:
    "Browse curated watches in Gjilan with filters for movement, strap, dial color, and availability.",
  alternates: {
    canonical: "/watches",
  },
  openGraph: {
    title: "BERIL Watches",
    description: "Curated watches in Gjilan with trusted local support.",
    images: [{ url: "/placeholders/product-default.svg" }],
  },
};

export default async function WatchesPage({ searchParams }: WatchesPageProps) {
  const parsed = parseCatalogSearchParams(await searchParams);
  const [products, options, messages] = await Promise.all([
    listCatalogProducts("watch", parsed),
    getCatalogFilterOptions("watch"),
    getServerMessages(),
  ]);

  const watchOptions = options as WatchCatalogFilterOptions;
  const activeFilterCount = Object.values(parsed).filter(
    (value) => value !== undefined && value !== null && value !== "" && value !== "newest",
  ).length;

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="premium">{messages.catalog.watches.badge}</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">{messages.catalog.watches.title}</h1>
          <p className="max-w-2xl text-sm text-graphite/76 sm:text-base">
            {messages.catalog.watches.subtitle}
          </p>
        </header>

        <div className="grid gap-7 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <WatchFilters
            key={buildSearchParams(parsed)}
            initialValues={parsed}
            options={watchOptions}
            messages={messages.catalog.filters}
          />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-graphite/72">
                {products.length} {messages.catalog.filters.productsCount}
                {activeFilterCount > 0
                  ? ` | ${activeFilterCount} ${messages.catalog.filters.activeFilters}`
                  : ""}
              </p>
              {activeFilterCount > 0 ? (
                <Link
                  href={`/watches?${buildSearchParams({ sort: parsed.sort })}`}
                  className="text-xs uppercase tracking-[0.12em] text-graphite/70"
                >
                  {messages.catalog.filters.keepSortOnly}
                </Link>
              ) : null}
            </div>

            {products.length === 0 ? (
              <div className="surface-panel space-y-4 p-8">
                <p className="text-sm text-graphite/75">{messages.catalog.watches.empty}</p>
                {activeFilterCount > 0 ? (
                  <Link
                    href="/watches"
                    className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/80 px-4 text-xs uppercase tracking-[0.12em] text-graphite transition hover:bg-white"
                  >
                    {messages.catalog.filters.clear}
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    movementLabel={getMovementLabel(product)}
                    messages={messages.productPage}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </SectionWrapper>
  );
}
