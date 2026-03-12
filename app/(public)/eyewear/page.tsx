import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { FloatInput, FloatSelect } from "@/components/ui/float-field";
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
import { getServerMessages } from "@/lib/i18n/server";

type EyewearPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Eyewear in Gjilan",
  description:
    "Explore BERIL eyewear in Gjilan with practical filters for frame type, shape, material, and availability.",
  alternates: {
    canonical: "/eyewear",
  },
  openGraph: {
    title: "BERIL Eyewear",
    description: "Refined eyewear in Gjilan with in-store support and adjustments.",
    images: [{ url: "/placeholders/product-default.svg" }],
  },
};

export default async function EyewearPage({ searchParams }: EyewearPageProps) {
  const parsed = parseCatalogSearchParams(await searchParams);
  const [products, options, messages] = await Promise.all([
    listCatalogProducts("eyewear", parsed),
    getCatalogFilterOptions("eyewear"),
    getServerMessages(),
  ]);

  const eyewearOptions = options as EyewearCatalogFilterOptions;
  const activeFilterCount = Object.values(parsed).filter(
    (value) => value !== undefined && value !== null && value !== "" && value !== "newest",
  ).length;

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="warm">{messages.catalog.eyewear.badge}</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">{messages.catalog.eyewear.title}</h1>
          <p className="max-w-2xl text-sm text-graphite/76 sm:text-base">
            {messages.catalog.eyewear.subtitle}
          </p>
        </header>

        <div className="grid gap-7 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="surface-panel h-fit p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-graphite/65">
                {messages.catalog.filters.title}
              </p>
              <Link
                href="/eyewear"
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
                {eyewearOptions.brands.map((brand) => (
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

              <FloatSelect label={messages.catalog.filters.frameType} id="frame_type" name="frame_type" defaultValue={parsed.frame_type ?? ""}>
                <option value="">{messages.catalog.filters.allFrameTypes}</option>
                {eyewearOptions.frameTypes.map((frameType) => (
                  <option key={frameType} value={frameType}>
                    {frameType}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.shape} id="shape" name="shape" defaultValue={parsed.shape ?? ""}>
                <option value="">{messages.catalog.filters.allShapes}</option>
                {eyewearOptions.shapes.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.material} id="material" name="material" defaultValue={parsed.material ?? ""}>
                <option value="">{messages.catalog.filters.allMaterials}</option>
                {eyewearOptions.materials.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.color} id="color" name="color" defaultValue={parsed.color ?? ""}>
                <option value="">{messages.catalog.filters.allColors}</option>
                {eyewearOptions.colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.gender} id="gender" name="gender" defaultValue={parsed.gender ?? ""}>
                <option value="">{messages.catalog.filters.all}</option>
                {eyewearOptions.genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </FloatSelect>

              <FloatSelect label={messages.catalog.filters.availability} id="availability" name="availability" defaultValue={parsed.availability ?? ""}>
                <option value="">{messages.catalog.filters.allStatus}</option>
                {eyewearOptions.availability.map((availability) => (
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
                  href={`/eyewear?${buildSearchParams({ sort: parsed.sort })}`}
                  className="text-xs uppercase tracking-[0.12em] text-graphite/70"
                >
                  {messages.catalog.filters.keepSortOnly}
                </Link>
              ) : null}
            </div>

            {products.length === 0 ? (
              <div className="surface-panel p-8 text-sm text-graphite/75">
                {messages.catalog.eyewear.empty}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-3">
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
