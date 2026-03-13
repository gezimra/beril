"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
};

type Props = {
  initialValues: CatalogSearchQuery;
  options: WatchCatalogFilterOptions;
  messages: FilterMessages;
};

export function WatchFilters({ initialValues, options, messages }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const apply = useCallback(() => {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (String(value) !== "") {
        params.set(key, String(value));
      }
    }
    router.push(`/watches?${params.toString()}`);
  }, [router]);

  return (
    <aside className="surface-panel h-fit p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-graphite/65">
          {messages.title}
        </p>
        <Link
          href="/watches"
          className="text-xs uppercase tracking-[0.14em] text-graphite/65 hover:text-graphite"
        >
          {messages.clear}
        </Link>
      </div>

      <form ref={formRef} className="space-y-4">
        <FloatSelect
          label={messages.sort}
          id="sort"
          name="sort"
          defaultValue={initialValues.sort}
          onChange={() => apply()}
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
          defaultValue={initialValues.brand ?? ""}
          onChange={() => apply()}
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
            defaultValue={initialValues.price_min}
            onBlur={() => apply()}
          />
          <FloatInput
            label={messages.maxEur}
            id="price_max"
            name="price_max"
            type="number"
            defaultValue={initialValues.price_max}
            onBlur={() => apply()}
          />
        </div>

        <FloatSelect
          label={messages.movement}
          id="movement"
          name="movement"
          defaultValue={initialValues.movement ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.strap ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.dial_color ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.case_size ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.availability ?? ""}
          onChange={() => apply()}
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
            name="new_arrivals"
            value="true"
            defaultChecked={initialValues.new_arrivals ?? false}
            onChange={() => apply()}
          />
          {messages.newArrivalsOnly}
        </label>
      </form>
    </aside>
  );
}
