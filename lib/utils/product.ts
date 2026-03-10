import type { Product } from "@/types/product";

export function stockStatusLabel(stockStatus: Product["stockStatus"]) {
  switch (stockStatus) {
    case "in_stock":
      return "In Stock";
    case "limited":
      return "Limited";
    case "available_on_request":
      return "Available on Request";
    case "out_of_stock":
      return "Out of Stock";
    default:
      return stockStatus;
  }
}

export function primaryCtaLabel(product: Product) {
  if (product.stockStatus === "out_of_stock") {
    return "Request Availability";
  }

  switch (product.primaryCtaMode) {
    case "add_to_cart":
      return "Add to Cart";
    case "reserve_in_store":
      return "Reserve in Store";
    case "whatsapp_inquiry":
      return "Inquire on WhatsApp";
    case "request_availability":
      return "Request Availability";
    default:
      return "View Details";
  }
}
