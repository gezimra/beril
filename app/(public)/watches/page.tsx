import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FloatInput, FloatSelect } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
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
          <aside className="surface-panel h-fit p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-graphite/65">
                {messages.catalog.filters.title}
              </p>
              <Link
                href="/watches"
                className="text-xs uppercase tracking-[0.14em] text-graphite/65 hover:text-graphite"
              >
                {messages.catalog.filters.clear}
              </Link>
            </div>

            <form method="get" className="space-y-4">
              <FloatSelect label={messages.catalog.filters.sort} id="sort" name="sort" defaultValue={parsed.sort}>
                <option value="newest">{messages.catalog.filters.newest}</option>
                <option value="price_asc">{messages.catalog.filters.priceLowHigh}</option>
                <option value="price_desc">{messages.catalog.filters.priceHighLow}</option>
                <option value="featured">{messages.catalog.filters.featured}</option>
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.brand} id="brand" name="brand" defaultValue={parsed.brand ?? ""}>
                <option value="">{messages.catalog.filters.allBrands}</option>
                {watchOptions.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </FloatSelect>

              <div className="grid grid-cols-2 gap-2">
                <FloatInput
                  label={messages.catalog.filters.minEur}
                  id="price_min"
                  name="price_min"
                  type="number"
                  defaultValue={parsed.price_min}
                />
                <FloatInput
                  label={messages.catalog.filters.maxEur}
                  id="price_max"
                  name="price_max"
                  type="number"
                  defaultValue={parsed.price_max}
                />
              </div>

              <FloatSelect label={messages.catalog.filters.movement} id="movement" name="movement" defaultValue={parsed.movement ?? ""}>
                <option value="">{messages.catalog.filters.allMovements}</option>
                {watchOptions.movements.map((movement) => (
                  <option key={movement} value={movement}>
                    {movement}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.strap} id="strap" name="strap" defaultValue={parsed.strap ?? ""}>
                <option value="">{messages.catalog.filters.allTypes}</option>
                {watchOptions.straps.map((strap) => (
                  <option key={strap} value={strap}>
                    {strap}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.dialColor} id="dial_color" name="dial_color" defaultValue={parsed.dial_color ?? ""}>
                <option value="">{messages.catalog.filters.allColors}</option>
                {watchOptions.dialColors.map((dialColor) => (
                  <option key={dialColor} value={dialColor}>
                    {dialColor}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.caseSize} id="case_size" name="case_size" defaultValue={parsed.case_size ?? ""}>
                <option value="">{messages.catalog.filters.allSizes}</option>
                {watchOptions.caseSizes.map((caseSize) => (
                  <option key={caseSize} value={caseSize}>
                    {caseSize}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.availability} id="availability" name="availability" defaultValue={parsed.availability ?? ""}>
                <option value="">{messages.catalog.filters.allStatus}</option>
                {watchOptions.availability.map((availability) => (
                  <option key={availability} value={availability}>
                    {availability}
                  </option>
                ))}
              </FloatSelect>

              <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
                <input
                  type="checkbox"
                  name="new_arrivals"
                  value="true"
                  defaultChecked={parsed.new_arrivals ?? false}
                />
                {messages.catalog.filters.newArrivalsOnly}
              </label>

              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
              >
                {messages.catalog.filters.apply}
              </button>
            </form>
          </aside>

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
              <div className="surface-panel p-8 text-sm text-graphite/75">
                {messages.catalog.watches.empty}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    movementLabel={getMovementLabel(product)}
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
