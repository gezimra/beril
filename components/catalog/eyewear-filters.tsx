"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
};

type Props = {
  initialValues: CatalogSearchQuery;
  options: EyewearCatalogFilterOptions;
  messages: FilterMessages;
};

export function EyewearFilters({ initialValues, options, messages }: Props) {
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
    router.push(`/eyewear?${params.toString()}`);
  }, [router]);

  return (
    <aside className="surface-panel h-fit p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-graphite/65">
          {messages.title}
        </p>
        <Link
          href="/eyewear"
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
          label={messages.frameType}
          id="frame_type"
          name="frame_type"
          defaultValue={initialValues.frame_type ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.shape ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.material ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.color ?? ""}
          onChange={() => apply()}
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
          defaultValue={initialValues.gender ?? ""}
          onChange={() => apply()}
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
