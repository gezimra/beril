import type {
  AffiliateStatus,
  AutomationTrigger,
  CampaignStatus,
  CouponStatus,
  DeliveryMethod,
  CashEntryType,
  HeroSlideStatus,
  HeroSlideType,
  InventoryItemType,
  JournalStatus,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionStatus,
  PromotionScope,
  PromotionStatus,
  PromotionType,
  PurchaseOrderStatus,
  PayoutStatus,
  RepairStatus,
  RewardType,
  StockStatus,
  StockMovementType,
  SupportChannel,
  SupportMessageDirection,
  SupportThreadStatus,
  TechnicianRole,
  WorkOrderStatus,
} from "@/types/domain";
import type { ProductCtaMode } from "@/types/product";

export interface AdminOrderItem {
  productId: string | null;
  title: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrderHistoryEvent {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  email: string | null;
  country: string;
  city: string;
  address: string;
  notes: string | null;
  internalNotes: string | null;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  history: AdminOrderHistoryEvent[];
}

export interface AdminRepairHistoryEvent {
  status: RepairStatus;
  note: string | null;
  createdAt: string;
  visibleToCustomer: boolean;
}

export interface AdminRepairAttachment {
  id: string;
  fileUrl: string;
  fileType: string;
  fileLabel: string | null;
  createdAt: string;
}

export interface AdminRepair {
  id: string;
  repairCode: string;
  customerName: string;
  email: string | null;
  phone: string;
  preferredContactMethod: "phone" | "email" | "whatsapp";
  itemType: string;
  brand: string;
  model: string;
  serviceType: string;
  description: string;
  status: RepairStatus;
  estimatedCompletion: string | null;
  amountDue: number | null;
  notesInternal: string | null;
  notesCustomer: string | null;
  createdAt: string;
  updatedAt: string;
  history: AdminRepairHistoryEvent[];
  attachments: AdminRepairAttachment[];
}

export interface AdminContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface AdminJournalPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  status: JournalStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductRow {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: "watch" | "eyewear";
  price: number;
  stockStatus: StockStatus;
  quantity: number | null;
  featured: boolean;
  isNew: boolean;
  primaryCtaMode: ProductCtaMode;
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  imageUrls: string[];
  specs: Array<{ key: string; value: string }>;
  status: "draft" | "active" | "archived";
}

export interface AdminDashboardStats {
  pendingOrders: number;
  newRepairs: number;
  lowStockProducts: number;
  contactInquiries: number;
}

export interface AdminCustomerRow {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  orderCount: number;
  repairCount: number;
  contactCount: number;
  latestOrderCode: string | null;
  latestRepairCode: string | null;
  latestContactSubject: string | null;
  lastActivityAt: string;
}

export interface AdminCustomerLookup {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  country: string | null;
  lastActivityAt: string;
}

export interface AdminCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPromotion {
  id: string;
  campaignId: string | null;
  name: string;
  status: PromotionStatus;
  type: PromotionType;
  scope: PromotionScope;
  percentageOff: number | null;
  amountOff: number | null;
  minOrderTotal: number;
  isStackable: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCoupon {
  id: string;
  promotionId: string;
  code: string;
  status: CouponStatus;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentTransaction {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  providerReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupportThread {
  id: string;
  customerProfileId: string | null;
  subject: string;
  channel: SupportChannel;
  status: SupportThreadStatus;
  assignedTo: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupportMessage {
  id: string;
  threadId: string;
  direction: SupportMessageDirection;
  message: string;
  senderName: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  createdAt: string;
}

export interface AdminNotificationTemplate {
  id: string;
  key: string;
  title: string;
  channel: NotificationChannel;
  trigger: AutomationTrigger;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotificationJob {
  id: string;
  templateId: string | null;
  customerProfileId: string | null;
  channel: NotificationChannel;
  trigger: AutomationTrigger;
  status: NotificationStatus;
  scheduledFor: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string | null;
  status: PurchaseOrderStatus;
  orderedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStockMovement {
  id: string;
  productId: string | null;
  inventoryItemId: string | null;
  movementType: StockMovementType;
  quantityDelta: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface AdminInventoryItem {
  id: string;
  sku: string;
  name: string;
  itemType: InventoryItemType;
  brand: string | null;
  model: string | null;
  caliber: string | null;
  quantityOnHand: number;
  reorderLevel: number;
  unitCost: number | null;
  unitPrice: number | null;
  location: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCashbookEntry {
  id: string;
  entryDate: string;
  entryType: CashEntryType;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface AdminWatchBrand {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWatchCaliber {
  id: string;
  brandId: string | null;
  caliberName: string;
  movementType: string;
  powerReserveHours: number | null;
  frequencyBph: number | null;
  jewels: number | null;
  diameterMm: number | null;
  heightMm: number | null;
  hasHacking: boolean;
  hasHandWinding: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWatchModel {
  id: string;
  brandId: string | null;
  modelName: string;
  collection: string | null;
  targetGender: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWatchReference {
  id: string;
  modelId: string;
  referenceCode: string;
  caliberId: string | null;
  caseSizeMm: number | null;
  lugWidthMm: number | null;
  waterResistanceM: number | null;
  crystal: string | null;
  caseMaterial: string | null;
  dialColor: string | null;
  strapType: string | null;
  productionFromYear: number | null;
  productionToYear: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInventoryCompatibility {
  id: string;
  inventoryItemId: string;
  caliberId: string | null;
  modelId: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AdminRepairPartUsage {
  id: string;
  workOrderId: string;
  inventoryItemId: string | null;
  partName: string;
  quantity: number;
  unitCost: number;
  createdAt: string;
}

export interface AdminWorkOrder {
  id: string;
  repairRequestId: string;
  status: WorkOrderStatus;
  diagnosis: string | null;
  estimateAmount: number | null;
  approvedByCustomer: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTechnicianAssignment {
  id: string;
  workOrderId: string;
  profileId: string | null;
  role: TechnicianRole;
  assignedAt: string;
}

export interface AdminLoyaltyRule {
  id: string;
  name: string;
  pointsPerEur: number;
  minRedeemPoints: number;
  rewardType: RewardType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoyaltyAccount {
  id: string;
  customerProfileId: string;
  pointsBalance: number;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAffiliate {
  id: string;
  name: string;
  email: string | null;
  code: string;
  status: AffiliateStatus;
  commissionRate: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAffiliatePayout {
  id: string;
  affiliateId: string;
  periodStart: string | null;
  periodEnd: string | null;
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHeroSlide {
  id: string;
  slideType: HeroSlideType;
  status: HeroSlideStatus;
  sortOrder: number;
  headline: string | null;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  backgroundImageUrl: string | null;
  backgroundImageAlt: string | null;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  productId: string | null;
  createdAt: string;
  updatedAt: string;
}
