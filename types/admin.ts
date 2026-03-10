import type {
  DeliveryMethod,
  JournalStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RepairStatus,
  StockStatus,
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
