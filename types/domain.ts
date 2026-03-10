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

export const paymentProviders = [
  "manual_offline",
  "stripe",
  "paypal",
  "bank_transfer",
] as const;
export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentTransactionStatuses = [
  "initiated",
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export type PaymentTransactionStatus =
  (typeof paymentTransactionStatuses)[number];

export const campaignStatuses = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "archived",
] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export const promotionStatuses = ["draft", "active", "paused", "archived"] as const;
export type PromotionStatus = (typeof promotionStatuses)[number];

export const promotionTypes = ["percentage", "fixed_amount", "free_shipping"] as const;
export type PromotionType = (typeof promotionTypes)[number];

export const promotionScopes = ["order", "product", "category"] as const;
export type PromotionScope = (typeof promotionScopes)[number];

export const couponStatuses = ["active", "paused", "expired", "archived"] as const;
export type CouponStatus = (typeof couponStatuses)[number];

export const supportChannels = ["web_chat", "whatsapp", "phone", "email"] as const;
export type SupportChannel = (typeof supportChannels)[number];

export const supportThreadStatuses = [
  "open",
  "pending_customer",
  "resolved",
  "archived",
] as const;
export type SupportThreadStatus = (typeof supportThreadStatuses)[number];

export const supportMessageDirections = [
  "inbound",
  "outbound",
  "internal",
] as const;
export type SupportMessageDirection = (typeof supportMessageDirections)[number];

export const notificationChannels = ["email", "whatsapp", "sms", "internal"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationStatuses = ["queued", "sent", "failed", "cancelled"] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

export const automationTriggers = [
  "order_created",
  "order_status_changed",
  "repair_created",
  "repair_status_changed",
  "abandoned_cart",
  "back_in_stock",
  "service_reminder",
] as const;
export type AutomationTrigger = (typeof automationTriggers)[number];

export const stockMovementTypes = [
  "manual_adjustment",
  "purchase_receive",
  "order_reserve",
  "order_release",
  "order_deduct",
  "repair_use",
] as const;
export type StockMovementType = (typeof stockMovementTypes)[number];

export const purchaseOrderStatuses = [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;
export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export const workOrderStatuses = [
  "pending",
  "assigned",
  "in_progress",
  "waiting_parts",
  "ready",
  "completed",
  "cancelled",
] as const;
export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export const technicianRoles = ["technician", "lead", "assistant"] as const;
export type TechnicianRole = (typeof technicianRoles)[number];

export const rewardTypes = ["points", "discount", "credit"] as const;
export type RewardType = (typeof rewardTypes)[number];

export const affiliateStatuses = ["pending", "active", "suspended", "archived"] as const;
export type AffiliateStatus = (typeof affiliateStatuses)[number];

export const payoutStatuses = ["pending", "approved", "paid", "cancelled"] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];

export interface Money {
  amount: number;
  currency: "EUR";
}
