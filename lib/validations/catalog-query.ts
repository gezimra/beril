import { z } from "zod";

const sortValues = ["newest", "price_asc", "price_desc", "featured"] as const;
const availabilityValues = [
  "in_stock",
  "limited",
  "available_on_request",
  "out_of_stock",
] as const;

const rawCatalogSearchSchema = z.object({
  brand: z.string().trim().min(1).optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  availability: z.enum(availabilityValues).optional(),
  sort: z.enum(sortValues).default("newest"),
  movement: z.string().trim().min(1).optional(),
  strap: z.string().trim().min(1).optional(),
  dial_color: z.string().trim().min(1).optional(),
  case_size: z.string().trim().min(1).optional(),
  new_arrivals: z.coerce.boolean().optional(),
  on_sale: z.coerce.boolean().optional(),
  frame_type: z.string().trim().min(1).optional(),
  shape: z.string().trim().min(1).optional(),
  material: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  gender: z.string().trim().min(1).optional(),
});

export type CatalogSort = (typeof sortValues)[number];
export type AvailabilityValue = (typeof availabilityValues)[number];

export type CatalogSearchQuery = z.infer<typeof rawCatalogSearchSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

function singleParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "" ? undefined : raw;
}

export function parseCatalogSearchParams(searchParams: RawSearchParams) {
  const parsed = rawCatalogSearchSchema.safeParse({
    brand: singleParam(searchParams.brand),
    price_min: singleParam(searchParams.price_min),
    price_max: singleParam(searchParams.price_max),
    availability: singleParam(searchParams.availability),
    sort: singleParam(searchParams.sort),
    movement: singleParam(searchParams.movement),
    strap: singleParam(searchParams.strap),
    dial_color: singleParam(searchParams.dial_color),
    case_size: singleParam(searchParams.case_size),
    new_arrivals: singleParam(searchParams.new_arrivals),
    on_sale: singleParam(searchParams.on_sale),
    frame_type: singleParam(searchParams.frame_type),
    shape: singleParam(searchParams.shape),
    material: singleParam(searchParams.material),
    color: singleParam(searchParams.color),
    gender: singleParam(searchParams.gender),
  });

  return parsed.success ? parsed.data : rawCatalogSearchSchema.parse({});
}

export function buildSearchParams(values: Partial<CatalogSearchQuery>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}
