import type { ProductCategory, StockStatus } from "@/types/domain";
import type { ProductCtaMode } from "@/types/product";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  category: ProductCategory;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  stockStatus: StockStatus;
  ctaMode: ProductCtaMode;
}
