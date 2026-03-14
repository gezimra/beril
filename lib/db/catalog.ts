import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { mockProducts } from "@/lib/db/mock-data";
import type { Product, ProductSpec } from "@/types/product";
import type { ProductCategory } from "@/types/domain";
import type { CatalogSearchQuery } from "@/lib/validations/catalog-query";

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: Product["category"];
  subtype: Product["subtype"];
  short_description: string;
  description: string;
  price: number;
  currency: "EUR";
  stock_status: Product["stockStatus"];
  quantity: number | null;
  featured: boolean;
  is_new: boolean;
  status: Product["status"];
  primary_cta_mode: Product["primaryCtaMode"];
  created_at: string;
  updated_at: string;
  warranty_months?: number;
  warranty_terms?: string | null;
  purchase_price?: number | null;
  sale_percentage?: number | null;
  campaign_sale_only?: boolean;
  product_images?: Array<{
    id: string;
    product_id: string;
    url: string;
    alt: string;
    sort_order: number;
  }>;
  product_specs?: Array<{
    id: string;
    product_id: string;
    key: string;
    value: string;
    sort_order: number;
  }>;
}

export interface BaseCatalogFilterOptions {
  brands: string[];
  availability: Product["stockStatus"][];
}

export interface WatchCatalogFilterOptions extends BaseCatalogFilterOptions {
  movements: string[];
  straps: string[];
  dialColors: string[];
  caseSizes: string[];
}

export interface EyewearCatalogFilterOptions extends BaseCatalogFilterOptions {
  frameTypes: string[];
  shapes: string[];
  materials: string[];
  colors: string[];
  genders: string[];
}

function toCamelProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    category: row.category,
    subtype: row.subtype,
    shortDescription: row.short_description,
    description: row.description,
    price: row.price,
    currency: row.currency,
    stockStatus: row.stock_status,
    quantity: row.quantity,
    featured: row.featured,
    isNew: row.is_new,
    status: row.status,
    primaryCtaMode: row.primary_cta_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    warrantyMonths: row.warranty_months ?? 0,
    warrantyTerms: row.warranty_terms ?? null,
    purchasePrice: row.purchase_price ?? null,
    salePercentage: row.sale_percentage ?? null,
    campaignSaleOnly: row.campaign_sale_only ?? false,
    images: (row.product_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        productId: image.product_id,
        url: image.url,
        alt: image.alt,
        sortOrder: image.sort_order,
      })),
    specs: (row.product_specs ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((spec) => ({
        id: spec.id,
        productId: spec.product_id,
        key: spec.key,
        value: spec.value,
        sortOrder: spec.sort_order,
      })),
  };
}

function getSpecValue(product: Product, key: string): string | null {
  const match = product.specs.find((spec) => spec.key === key);
  return match?.value ?? null;
}

function sortProducts(products: Product[], sort: CatalogSearchQuery["sort"]) {
  const result = [...products];

  switch (sort) {
    case "price_asc":
      return result.sort((a, b) => a.price - b.price);
    case "price_desc":
      return result.sort((a, b) => b.price - a.price);
    case "featured":
      return result.sort((a, b) => Number(b.featured) - Number(a.featured));
    case "newest":
    default:
      return result.sort((a, b) => {
        if (a.isNew !== b.isNew) {
          return Number(b.isNew) - Number(a.isNew);
        }

        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      });
  }
}

function applyFilters(
  products: Product[],
  category: ProductCategory,
  filters: CatalogSearchQuery,
) {
  return products.filter((product) => {
    if (product.category !== category) {
      return false;
    }

    if (product.status !== "active") {
      return false;
    }

    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }

    const effectivePrice =
      product.salePercentage && product.salePercentage > 0 && !product.campaignSaleOnly
        ? product.price * (1 - product.salePercentage / 100)
        : product.price;

    if (filters.price_min !== undefined && effectivePrice < filters.price_min) {
      return false;
    }

    if (filters.price_max !== undefined && effectivePrice > filters.price_max) {
      return false;
    }

    if (filters.availability && product.stockStatus !== filters.availability) {
      return false;
    }

    if (filters.new_arrivals && !product.isNew) {
      return false;
    }

    if (filters.on_sale && !(product.salePercentage && product.salePercentage > 0 && !product.campaignSaleOnly)) {
      return false;
    }

    if (category === "watch") {
      if (filters.movement && getSpecValue(product, "movement") !== filters.movement) {
        return false;
      }
      if (filters.strap && getSpecValue(product, "strap") !== filters.strap) {
        return false;
      }
      if (
        filters.dial_color &&
        getSpecValue(product, "dial_color") !== filters.dial_color
      ) {
        return false;
      }
      if (filters.case_size && getSpecValue(product, "case_size") !== filters.case_size) {
        return false;
      }
    }

    if (category === "eyewear") {
      if (
        filters.frame_type &&
        getSpecValue(product, "frame_type") !== filters.frame_type
      ) {
        return false;
      }
      if (filters.shape && getSpecValue(product, "shape") !== filters.shape) {
        return false;
      }
      if (filters.material && getSpecValue(product, "material") !== filters.material) {
        return false;
      }
      if (filters.color && getSpecValue(product, "color") !== filters.color) {
        return false;
      }
      if (filters.gender && getSpecValue(product, "gender") !== filters.gender) {
        return false;
      }
    }

    return true;
  });
}

async function getProductsFromSupabase(): Promise<Product[] | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      title,
      brand,
      category,
      subtype,
      short_description,
      description,
      price,
      currency,
      stock_status,
      quantity,
      featured,
      is_new,
      status,
      primary_cta_mode,
      created_at,
      updated_at,
      warranty_months,
      warranty_terms,
      purchase_price,
      sale_percentage,
      campaign_sale_only,
      product_images(id, product_id, url, alt, sort_order),
      product_specs(id, product_id, key, value, sort_order)
      `,
    )
    .eq("status", "active");

  if (error || !data) {
    return null;
  }

  return (data as ProductRow[]).map(toCamelProduct);
}

async function getProductsSource(): Promise<Product[]> {
  const productsFromDb = await getProductsFromSupabase();
  if (productsFromDb && productsFromDb.length > 0) {
    return productsFromDb;
  }

  return mockProducts;
}

export async function getAllActiveProducts() {
  const products = await getProductsSource();
  return products.filter((product) => product.status === "active");
}

export async function getFeaturedProducts(
  category: ProductCategory,
  limit = 8,
): Promise<Product[]> {
  const products = await getProductsSource();
  return products
    .filter((product) => product.category === category && product.featured)
    .slice(0, limit);
}

const CATALOG_PAGE_SIZE = 36;

export async function listCatalogProducts(
  category: ProductCategory,
  filters: CatalogSearchQuery,
  page = 1,
) {
  const products = await getProductsSource();
  const filtered = applyFilters(products, category, filters);
  const sorted = sortProducts(filtered, filters.sort);
  const total = sorted.length;
  const from = (page - 1) * CATALOG_PAGE_SIZE;
  return { products: sorted.slice(from, from + CATALOG_PAGE_SIZE), total, hasMore: from + CATALOG_PAGE_SIZE < total };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProductsSource();
  return products.find((product) => product.slug === slug) ?? null;
}

function extractDistinctSpecValues(
  products: Product[],
  key: string,
  category: ProductCategory,
) {
  const values = new Set<string>();

  for (const product of products) {
    if (product.category !== category) {
      continue;
    }

    const value = getSpecValue(product, key);
    if (value) {
      values.add(value);
    }
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export async function getCatalogFilterOptions(
  category: ProductCategory,
): Promise<WatchCatalogFilterOptions | EyewearCatalogFilterOptions> {
  const products = await getProductsSource();
  const categoryProducts = products.filter((product) => product.category === category);

  const brands = Array.from(new Set(categoryProducts.map((product) => product.brand))).sort(
    (a, b) => a.localeCompare(b),
  );

  const availability = Array.from(
    new Set(categoryProducts.map((product) => product.stockStatus)),
  );

  if (category === "watch") {
    return {
      brands,
      availability,
      movements: extractDistinctSpecValues(products, "movement", category),
      straps: extractDistinctSpecValues(products, "strap", category),
      dialColors: extractDistinctSpecValues(products, "dial_color", category),
      caseSizes: extractDistinctSpecValues(products, "case_size", category),
    };
  }

  return {
    brands,
    availability,
    frameTypes: extractDistinctSpecValues(products, "frame_type", category),
    shapes: extractDistinctSpecValues(products, "shape", category),
    materials: extractDistinctSpecValues(products, "material", category),
    colors: extractDistinctSpecValues(products, "color", category),
    genders: extractDistinctSpecValues(products, "gender", category),
  };
}

export function getProductSpecMap(product: Product) {
  return product.specs.reduce<Record<string, string>>((result, spec) => {
    result[spec.key] = spec.value;
    return result;
  }, {});
}

export function getMovementLabel(product: Product) {
  if (product.category !== "watch") {
    return null;
  }

  return getSpecValue(product, "movement");
}

export function getRelatedProducts(
  products: Product[],
  currentProduct: Product,
  limit = 4,
) {
  return products
    .filter((product) => product.id !== currentProduct.id)
    .filter((product) => product.category === currentProduct.category)
    .slice(0, limit);
}

export function groupSpecsForDisplay(product: Product) {
  const watchOrder = [
    "movement",
    "case_size",
    "crystal",
    "water_resistance",
    "strap",
    "dial_color",
    "case_material",
  ];
  const eyewearOrder = [
    "frame_material",
    "lens_width",
    "bridge_width",
    "temple_length",
    "shape",
    "color",
    "lens_type",
  ];

  const keyOrder = product.category === "watch" ? watchOrder : eyewearOrder;

  return [...product.specs].sort((a, b) => {
    const aIndex = keyOrder.indexOf(a.key);
    const bIndex = keyOrder.indexOf(b.key);

    if (aIndex === -1 && bIndex === -1) {
      return a.sortOrder - b.sortOrder;
    }
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
}

export function hasDisplaySpec(product: Product, key: ProductSpec["key"]) {
  return product.specs.some((spec) => spec.key === key);
}
