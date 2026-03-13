import type { Product } from "@/types/product";

type StockMessages = {
  stockInStock: string;
  stockLimited: string;
  stockAvailableOnRequest: string;
  stockOutOfStock: string;
};

type CtaMessages = {
  ctaAddToCart: string;
  ctaReserveInStore: string;
  ctaInquireWhatsapp: string;
  ctaRequestAvailability: string;
  ctaViewDetails: string;
};

export function stockStatusLabel(
  stockStatus: Product["stockStatus"],
  messages?: StockMessages,
) {
  switch (stockStatus) {
    case "in_stock":
      return messages?.stockInStock ?? "In Stock";
    case "limited":
      return messages?.stockLimited ?? "Limited";
    case "available_on_request":
      return messages?.stockAvailableOnRequest ?? "Available on Request";
    case "out_of_stock":
      return messages?.stockOutOfStock ?? "Out of Stock";
    default:
      return stockStatus;
  }
}

export function primaryCtaLabel(product: Product, messages?: CtaMessages) {
  if (product.stockStatus === "out_of_stock") {
    return messages?.ctaRequestAvailability ?? "Request Availability";
  }

  switch (product.primaryCtaMode) {
    case "add_to_cart":
      return messages?.ctaAddToCart ?? "Add to Cart";
    case "reserve_in_store":
      return messages?.ctaReserveInStore ?? "Reserve in Store";
    case "whatsapp_inquiry":
      return messages?.ctaInquireWhatsapp ?? "Inquire on WhatsApp";
    case "request_availability":
      return messages?.ctaRequestAvailability ?? "Request Availability";
    default:
      return messages?.ctaViewDetails ?? "View Details";
  }
}
