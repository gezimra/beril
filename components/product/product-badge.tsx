import { StatusBadge } from "@/components/ui/status-badge";
import type { Product } from "@/types/product";

interface ProductBadgeProps {
  type: "movement" | "new" | "stock";
  value: string;
  stockStatus?: Product["stockStatus"];
}

export function ProductBadge({ type, value, stockStatus }: ProductBadgeProps) {
  if (type === "movement") {
    return <StatusBadge tone="neutral">{value}</StatusBadge>;
  }

  if (type === "new") {
    return <StatusBadge tone="premium">New</StatusBadge>;
  }

  if (type === "stock") {
    const tone =
      stockStatus === "in_stock"
        ? "service"
        : stockStatus === "limited"
          ? "warm"
          : stockStatus === "available_on_request"
            ? "premium"
            : "neutral";

    return <StatusBadge tone={tone}>{value}</StatusBadge>;
  }

  return null;
}
