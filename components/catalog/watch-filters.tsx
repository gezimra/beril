"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FloatInput, FloatSelect } from "@/components/ui/float-field";
import type { WatchCatalogFilterOptions } from "@/lib/db/catalog";
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
  movement: string;
  allMovements: string;
  strap: string;
  allTypes: string;
  dialColor: string;
  allColors: string;
  caseSize: string;
  allSizes: string;
  availability: string;
  allStatus: string;
  newArrivalsOnly: string;
  onSaleOnly: string;
};

type Props = {
  initialValues: CatalogSearchQuery;
  options: WatchCatalogFilterOptions;
  messages: FilterMessages;
};

type FilterState = {
  sort: string;
  brand: string;
  price_min: string;
  price_max: string;
  movement: string;
  strap: string;
  dial_color: string;
  case_size: string;
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
    movement: v.movement ?? "",
    strap: v.strap ?? "",
    dial_color: v.dial_color ?? "",
    case_size: v.case_size ?? "",
    availability: v.availability ?? "",
    new_arrivals: v.new_arrivals ?? false,
    on_sale: v.on_sale ?? false,
  };
}

function emptyState(): FilterState {
  return toState({});
}

function countActiveFilters(s: FilterState) {
  return [
    s.brand,
    s.price_min,
    s.price_max,
    s.movement,
    s.strap,
    s.dial_color,
    s.case_size,
    s.availability,
    s.new_arrivals,
    s.on_sale,
  ].filter(Boolean).length;
}

export function WatchFilters({ initialValues, options, messages }: Props) {
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
    if (state.movement) params.set("movement", state.movement);
    if (state.strap) params.set("strap", state.strap);
    if (state.dial_color) params.set("dial_color", state.dial_color);
    if (state.case_size) params.set("case_size", state.case_size);
    if (state.availability) params.set("availability", state.availability);
    if (state.new_arrivals) params.set("new_arrivals", "true");
    if (state.on_sale) params.set("on_sale", "true");
    router.push(`/watches?${params.toString()}`);
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
    const empty = emptyState();
    latestRef.current = empty;
    setFilters(empty);
    router.push("/watches");
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
              label={messages.movement}
              id="movement"
              name="movement"
              value={filters.movement}
              onChange={(e) => update({ movement: e.target.value })}
            >
              <option value="">{messages.allMovements}</option>
              {options.movements.map((movement) => (
                <option key={movement} value={movement}>
                  {movement}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.strap}
              id="strap"
              name="strap"
              value={filters.strap}
              onChange={(e) => update({ strap: e.target.value })}
            >
              <option value="">{messages.allTypes}</option>
              {options.straps.map((strap) => (
                <option key={strap} value={strap}>
                  {strap}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.dialColor}
              id="dial_color"
              name="dial_color"
              value={filters.dial_color}
              onChange={(e) => update({ dial_color: e.target.value })}
            >
              <option value="">{messages.allColors}</option>
              {options.dialColors.map((dialColor) => (
                <option key={dialColor} value={dialColor}>
                  {dialColor}
                </option>
              ))}
            </FloatSelect>

            <FloatSelect
              label={messages.caseSize}
              id="case_size"
              name="case_size"
              value={filters.case_size}
              onChange={(e) => update({ case_size: e.target.value })}
            >
              <option value="">{messages.allSizes}</option>
              {options.caseSizes.map((caseSize) => (
                <option key={caseSize} value={caseSize}>
                  {caseSize}
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
