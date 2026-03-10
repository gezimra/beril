export const productCategories = ["watch", "eyewear"] as const;
export type ProductCategory = (typeof productCategories)[number];

export const productSubtypes = [
  "analog_watch",
  "smart_watch",
  "frame",
  "sunglasses",
  "service_accessory",
] as const;
export type ProductSubtype = (typeof productSubtypes)[number];

export const stockStatuses = [
  "in_stock",
  "limited",
  "available_on_request",
  "out_of_stock",
] as const;
export type StockStatus = (typeof stockStatuses)[number];

export const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = [
  "cash_on_delivery",
  "pay_in_store",
  "card_online",
  "bank_transfer",
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentStatuses = [
  "pending",
  "not_required",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const deliveryMethods = ["home_delivery", "store_pickup"] as const;
export type DeliveryMethod = (typeof deliveryMethods)[number];

export const repairStatuses = [
  "request_received",
  "awaiting_drop_off",
  "received_in_store",
  "under_inspection",
  "waiting_parts",
  "in_repair",
  "ready_for_pickup",
  "completed",
  "cancelled",
] as const;
export type RepairStatus = (typeof repairStatuses)[number];

export const journalStatuses = ["draft", "published", "archived"] as const;
export type JournalStatus = (typeof journalStatuses)[number];

export const userRoles = ["owner", "manager", "service_staff", "editor"] as const;
export type UserRole = (typeof userRoles)[number];

export const preferredContactMethods = ["phone", "email", "whatsapp"] as const;
export type PreferredContactMethod = (typeof preferredContactMethods)[number];

export interface Money {
  amount: number;
  currency: "EUR";
}
