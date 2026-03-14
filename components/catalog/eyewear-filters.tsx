"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FloatInput, FloatSelect } from "@/components/ui/float-field";
import type { EyewearCatalogFilterOptions } from "@/lib/db/catalog";
import type { CatalogSearchQuery } from "@/lib/validations/catalog-query";

type FilterMessages = {
  title: string;
  clear: string;
  sort: string;
  newest: string;
  priceLowHigh: string;
  priceHighLow: string;
  featured: string;
  brand: string;
  allBrands: string;
  minEur: string;
  maxEur: string;
  frameType: string;
  allFrameTypes: string;
  shape: string;
  allShapes: string;
  material: string;
  allMaterials: string;
  color: string;
  allColors: string;
  gender: string;
  all: string;
  availability: string;
  allStatus: string;
  newArrivalsOnly: string;
  onSaleOnly: string;
};

type Props = {
  initialValues: CatalogSearchQuery;
  options: EyewearCatalogFilterOptions;
  messages: FilterMessages;
};

type FilterState = {
  sort: string;
  brand: string;
  price_min: string;
  price_max: string;
  frame_type: string;
  shape: string;
  material: string;
  color: string;
  gender: string;
  availability: string;
  new_arrivals: boolean;
  on_sale: boolean;
};

function toState(v: Partial<CatalogSearchQuery>): FilterState {
  return {
    sort: v.sort ?? "newest",
    brand: v.brand ?? "",
    price_min: String(v.price_min ?? ""),
    price_max: String(v.price_max ?? ""),
    frame_type: v.frame_type ?? "",
    shape: v.shape ?? "",
    material: v.material ?? "",
    color: v.color ?? "",
    gender: v.gender ?? "",
    availability: v.availability ?? "",
    new_arrivals: v.new_arrivals ?? false,
    on_sale: v.on_sale ?? false,
  };
}

function countActiveFilters(s: FilterState) {
  return [
    s.brand,
    s.price_min,
    s.price_max,
    s.frame_type,
    s.shape,
    s.material,
    s.color,
    s.gender,
    s.availability,
    s.new_arrivals,
    s.on_sale,
  ].filter(Boolean).length;
}

export function EyewearFilters({ initialValues, options, messages }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const justOpenedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => toState(initialValues));
  const latestRef = useRef(filters);
  const activeCount = countActiveFilters(filters);

  // Auto-collapse on mobile only when scrolling DOWN past threshold.
  // Grace period after opening prevents layout-shift scroll from immediately re-collapsing.
  useEffect(() => {
    let prevY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (window.innerWidth < 1280 && currentY > prevY && currentY > 80 && !justOpenedRef.current) {
        setOpen(false);
      }
      prevY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const push = useCallback((state: FilterState) => {
    const params = new URLSearchParams();
    if (state.sort) params.set("sort", state.sort);
    if (state.brand) params.set("brand", state.brand);
    if (state.price_min) params.set("price_min", state.price_min);
    if (state.price_max) params.set("price_max", state.price_max);
    if (state.frame_type) params.set("frame_type", state.frame_type);
    if (state.shape) params.set("shape", state.shape);
    if (state.material) params.set("material", state.material);
    if (state.color) params.set("color", state.color);
    if (state.gender) params.set("gender", state.gender);
    if (state.availability) params.set("availability", state.availability);
    if (state.new_arrivals) params.set("new_arrivals", "true");
    if (state.on_sale) params.set("on_sale", "true");
    router.push(`/eyewear?${params.toString()}`);
  }, [router]);

  const update = useCallback((partial: Partial<FilterState>) => {
    const next = { ...latestRef.current, ...partial };
    latestRef.current = next;
    setFilters(next);
    push(next);
  }, [push]);

  const updateDebounced = useCallback((partial: Partial<FilterState>) => {
    const next = { ...latestRef.current, ...partial };
    latestRef.current = next;
    setFilters(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(latestRef.current), 600);
  }, [push]);

  const clear = useCallback(() => {
    const empty = toState({});
    latestRef.current = empty;
    setFilters(empty);
    router.push("/eyewear");
  }, [router]);

  return (
    <aside className="sticky top-20 z-30 xl:top-24 xl:self-start">
      <div className="surface-panel max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header — always visible, acts as the toggle on mobile */}
        <button
          type="button"
          onClick={() => {
            if (!open) {
              justOpenedRef.current = true;
              setTimeout(() => { justOpenedRef.current = false; }, 400);
            }
            setOpen((v) => !v);
          }}
          className="xl:hidden w-full flex items-center justify-between px-5 py-4"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-graphite/65">
              {messages.title}
            </span>
            {activeCount > 0 && (
              <span className="rounded-full bg-mineral px-2 py-0.5 text-[0.6rem] font-medium text-white">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-xs text-graphite/45">{open ? "▲" : "▼"}</span>
        </button>

        {/* Desktop header */}
        <div className="hidden xl:flex items-center justify-between px-5 pt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-graphite/65">
            {messages.title}
          </p>
          <button
            type="button"
            onClick={clear}
            className="text-xs uppercase tracking-[0.14em] text-graphite/65 hover:text-graphite"
          >
            {messages.clear}
          </button>
        </div>

        <div className={open ? "px-5 pb-5 pt-2" : "hidden xl:block xl:px-5 xl:pb-5 xl:pt-4"}>
          {/* Mobile clear button */}
          {open && (
            <div className="mb-3 flex justify-end xl:hidden">
              <button
                type="button"
                onClick={clear}
                className="text-xs uppercase tracking-[0.14em] text-graphite/65 hover:text-graphite"
              >
                {messages.clear}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <FloatSelect
              label={messages.sort}
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">{messages.newest}</option>
              <option value="price_asc">{messages.priceLowHigh}</option>
              <option value="price_desc">{messages.priceHighLow}</option>
              <option value="featured">{messages.featured}</option>
            </FloatSelect>

            <FloatSelect
              label={messages.brand}
              id="brand"
              name="brand"
              value={filters.brand}
              onChange={(e) => update({ brand: e.target.value })}
            >
              <option value="">{messages.allBrands}</option>
              {options.brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </FloatSelect>

            <div className="grid grid-cols-2 gap-2">
              <FloatInput
                label={messages.minEur}
                id="price_min"
                name="price_min"
                type="number"
                value={filters.price_min}
                onChange={(e) => updateDebounced({ price_min: e.target.value })}
              />
              <FloatInput
                label={messages.maxEur}
                id="price_max"
                name="price_max"
                type="number"
                value={filters.price_max}
                onChange={(e) => updateDebounced({ price_max: e.target.value })}
              />
            </div>

            <FloatSelect
              label={messages.frameType}
              id="frame_type"
              name="frame_type"
              value={filters.frame_type}
              onChange={(e) => update({ frame_type: e.target.value })}
            >
              <option value="">{messages.allFrameTypes}</option>
              {options.frameTypes.map((frameType) => (
                <option key={frameType} value={frameType}>
                  {frameType}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.shape}
              id="shape"
              name="shape"
              value={filters.shape}
              onChange={(e) => update({ shape: e.target.value })}
            >
              <option value="">{messages.allShapes}</option>
              {options.shapes.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.material}
              id="material"
              name="material"
              value={filters.material}
              onChange={(e) => update({ material: e.target.value })}
            >
              <option value="">{messages.allMaterials}</option>
              {options.materials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.color}
              id="color"
              name="color"
              value={filters.color}
              onChange={(e) => update({ color: e.target.value })}
            >
              <option value="">{messages.allColors}</option>
              {options.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.gender}
              id="gender"
              name="gender"
              value={filters.gender}
              onChange={(e) => update({ gender: e.target.value })}
            >
              <option value="">{messages.all}</option>
              {options.genders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.availability}
              id="availability"
              name="availability"
              value={filters.availability}
              onChange={(e) => update({ availability: e.target.value })}
            >
              <option value="">{messages.allStatus}</option>
              {options.availability.map((availability) => (
                <option key={availability} value={availability}>
                  {availability}
                </option>
              ))}
            </FloatSelect>

            <label className="flex items-center gap-2 rounded-lg border border-graphite/15 bg-white/75 px-3 py-2 text-sm text-graphite/78">
              <input
                type="checkbox"
                checked={filters.new_arrivals}
                onChange={(e) => update({ new_arrivals: e.target.checked })}
              />
              {messages.newArrivalsOnly}
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-mineral/15 bg-mineral/[0.04] px-3 py-2 text-sm text-mineral/80">
              <input
                type="checkbox"
                checked={filters.on_sale}
                onChange={(e) => update({ on_sale: e.target.checked })}
              />
              {messages.onSaleOnly}
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
