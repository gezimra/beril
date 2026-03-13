import type { ProductCategory, StockStatus } from "@/types/domain";

export interface WishlistItem {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  category: ProductCategory;
  imageUrl: string;
  price: number;
  stockStatus: StockStatus;
}
