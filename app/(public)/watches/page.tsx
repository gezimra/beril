import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
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
  const [products, options] = await Promise.all([
    listCatalogProducts("watch", parsed),
    getCatalogFilterOptions("watch"),
  ]);

  const watchOptions = options as WatchCatalogFilterOptions;
  const activeFilterCount = Object.values(parsed).filter(
    (value) => value !== undefined && value !== null && value !== "" && value !== "newest",
  ).length;

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="premium">Watches</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Watches Catalog</h1>
          <p className="max-w-2xl text-sm text-graphite/76 sm:text-base">
            Browse BERIL watches by movement, strap, dial color, case size, and
            availability.
          </p>
        </header>

        <div className="grid gap-7 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="surface-panel h-fit p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-graphite/65">
                Filters
              </p>
              <Link
                href="/watches"
                className="text-xs uppercase tracking-[0.14em] text-graphite/65 hover:text-graphite"
              >
                Clear
              </Link>
            </div>

            <form method="get" className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="sort" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Sort
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={parsed.sort}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price low-high</option>
                  <option value="price_desc">Price high-low</option>
                  <option value="featured">Featured</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="brand" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Brand
                </label>
                <select
                  id="brand"
                  name="brand"
                  defaultValue={parsed.brand ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All brands</option>
                  {watchOptions.brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="price_min" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                    Min EUR
                  </label>
                  <input
                    id="price_min"
                    name="price_min"
                    type="number"
                    defaultValue={parsed.price_min}
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="price_max" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                    Max EUR
                  </label>
                  <input
                    id="price_max"
                    name="price_max"
                    type="number"
                    defaultValue={parsed.price_max}
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="movement" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Movement
                </label>
                <select
                  id="movement"
                  name="movement"
                  defaultValue={parsed.movement ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All movements</option>
                  {watchOptions.movements.map((movement) => (
                    <option key={movement} value={movement}>
                      {movement}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="strap" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Strap
                </label>
                <select
                  id="strap"
                  name="strap"
                  defaultValue={parsed.strap ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All types</option>
                  {watchOptions.straps.map((strap) => (
                    <option key={strap} value={strap}>
                      {strap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="dial_color" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Dial Color
                </label>
                <select
                  id="dial_color"
                  name="dial_color"
                  defaultValue={parsed.dial_color ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All colors</option>
                  {watchOptions.dialColors.map((dialColor) => (
                    <option key={dialColor} value={dialColor}>
                      {dialColor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="case_size" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Case Size
                </label>
                <select
                  id="case_size"
                  name="case_size"
                  defaultValue={parsed.case_size ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All sizes</option>
                  {watchOptions.caseSizes.map((caseSize) => (
                    <option key={caseSize} value={caseSize}>
                      {caseSize}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="availability" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Availability
                </label>
                <select
                  id="availability"
                  name="availability"
                  defaultValue={parsed.availability ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All status</option>
                  {watchOptions.availability.map((availability) => (
                    <option key={availability} value={availability}>
                      {availability}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
                <input
                  type="checkbox"
                  name="new_arrivals"
                  value="true"
                  defaultChecked={parsed.new_arrivals ?? false}
                />
                New arrivals only
              </label>

              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
              >
                Apply Filters
              </button>
            </form>
          </aside>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-graphite/72">
                {products.length} products
                {activeFilterCount > 0 ? ` | ${activeFilterCount} active filters` : ""}
              </p>
              {activeFilterCount > 0 ? (
                <Link
                  href={`/watches?${buildSearchParams({ sort: parsed.sort })}`}
                  className="text-xs uppercase tracking-[0.12em] text-graphite/70"
                >
                  Keep sort only
                </Link>
              ) : null}
            </div>

            {products.length === 0 ? (
              <div className="surface-panel p-8 text-sm text-graphite/75">
                No watches match these filters. Try broadening your search.
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
