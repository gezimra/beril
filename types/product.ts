import type { ProductCategory, ProductSubtype, StockStatus } from "@/types/domain";

export type ProductStatus = "draft" | "active" | "archived";

export type ProductCtaMode =
  | "add_to_cart"
  | "reserve_in_store"
  | "whatsapp_inquiry"
  | "request_availability";

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductSpec {
  id: string;
  productId: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: ProductCategory;
  subtype: ProductSubtype;
  shortDescription: string;
  description: string;
  price: number;
  currency: "EUR";
  stockStatus: StockStatus;
  quantity: number | null;
  featured: boolean;
  isNew: boolean;
  status: ProductStatus;
  primaryCtaMode: ProductCtaMode;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  specs: ProductSpec[];
}
