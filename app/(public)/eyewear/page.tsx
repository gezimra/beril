import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCatalogFilterOptions,
  listCatalogProducts,
  type EyewearCatalogFilterOptions,
} from "@/lib/db/catalog";
import {
  buildSearchParams,
  parseCatalogSearchParams,
} from "@/lib/validations/catalog-query";

type EyewearPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EyewearPage({ searchParams }: EyewearPageProps) {
  const parsed = parseCatalogSearchParams(await searchParams);
  const [products, options] = await Promise.all([
    listCatalogProducts("eyewear", parsed),
    getCatalogFilterOptions("eyewear"),
  ]);

  const eyewearOptions = options as EyewearCatalogFilterOptions;
  const activeFilterCount = Object.values(parsed).filter(
    (value) => value !== undefined && value !== null && value !== "" && value !== "newest",
  ).length;

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="warm">Eyewear</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Eyewear Catalog</h1>
          <p className="max-w-2xl text-sm text-graphite/76 sm:text-base">
            Browse BERIL eyewear by frame type, shape, material, color, and
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
                href="/eyewear"
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
                  {eyewearOptions.brands.map((brand) => (
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
                <label htmlFor="frame_type" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Frame Type
                </label>
                <select
                  id="frame_type"
                  name="frame_type"
                  defaultValue={parsed.frame_type ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All frame types</option>
                  {eyewearOptions.frameTypes.map((frameType) => (
                    <option key={frameType} value={frameType}>
                      {frameType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="shape" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Shape
                </label>
                <select
                  id="shape"
                  name="shape"
                  defaultValue={parsed.shape ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All shapes</option>
                  {eyewearOptions.shapes.map((shape) => (
                    <option key={shape} value={shape}>
                      {shape}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="material" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Material
                </label>
                <select
                  id="material"
                  name="material"
                  defaultValue={parsed.material ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All materials</option>
                  {eyewearOptions.materials.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="color" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Color
                </label>
                <select
                  id="color"
                  name="color"
                  defaultValue={parsed.color ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All colors</option>
                  {eyewearOptions.colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="gender" className="text-xs uppercase tracking-[0.14em] text-graphite/65">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  defaultValue={parsed.gender ?? ""}
                  className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {eyewearOptions.genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
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
                  {eyewearOptions.availability.map((availability) => (
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
                  href={`/eyewear?${buildSearchParams({ sort: parsed.sort })}`}
                  className="text-xs uppercase tracking-[0.12em] text-graphite/70"
                >
                  Keep sort only
                </Link>
              ) : null}
            </div>

            {products.length === 0 ? (
              <div className="surface-panel p-8 text-sm text-graphite/75">
                No eyewear products match these filters. Try broadening your search.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </SectionWrapper>
  );
}
