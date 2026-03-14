"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { verifyAdminSession } from "@/lib/admin-auth";
import { validateUploadFile, getFileBytes, MAX_UPLOAD_SIZE_BYTES } from "@/lib/admin-upload";

import {
  addAdminRepairAttachment,
  deleteAdminHeroSlide,
  updateAdminOrderInternalNotes,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
  updateAdminRepairEstimate,
  updateAdminRepairNotes,
  updateAdminRepairStatus,
  updateAdminSiteSetting,
  addAdminProductImageUrl,
  deleteAdminProductImage,
  uploadAdminHeroSlideImage,
  uploadAdminProductGalleryImage,
  uploadAdminProductPrimaryImage,
  uploadAdminJournalCoverImage,
  uploadAdminSiteImage,
  upsertAdminHeroSlide,
  upsertAdminJournalPost,
  upsertAdminProduct,
} from "@/lib/db/admin";
import {
  addSupportMessage,
  createSupportThread,
  queueNotificationJob,
  updateSupportThreadStatus,
  upsertAdminNotificationTemplate,
} from "@/lib/db/crm-support";
import {
  createManualAdminOrder,
  createManualAdminRepairRequest,
  createAdminCashbookEntry,
  createAdminRepairPartUsage,
  createStockMovement,
  upsertAdminInventoryCompatibility,
  upsertAdminInventoryItem,
  upsertAdminPurchaseOrder,
  upsertAdminSupplier,
  upsertAdminWatchBrand,
  upsertAdminWatchCaliber,
  upsertAdminWatchModel,
  upsertAdminWatchReference,
  upsertAdminWorkOrder,
  upsertServiceItem,
} from "@/lib/db/inventory-ops";
import {
  assignCouponToCustomerByEmail,
  upsertAdminCampaign,
  upsertAdminCoupon,
  upsertAdminPromotion,
  updateAdminPaymentTransactionStatus,
} from "@/lib/db/payments-promotions";
import {
  upsertAdminAffiliate,
  upsertAdminAffiliatePayout,
  upsertAdminLoyaltyRule,
} from "@/lib/db/growth-loyalty";
import {
  affiliateStatuses,
  automationTriggers,
  cashEntryTypes,
  campaignStatuses,
  couponStatuses,
  deliveryMethods,
  heroSlideStatuses,
  heroSlideTypes,
  inventoryItemTypes,
  journalStatuses,
  notificationChannels,
  orderStatuses,
  paymentTransactionStatuses,
  payoutStatuses,
  paymentMethods,
  paymentStatuses,
  promotionScopes,
  promotionStatuses,
  promotionTypes,
  preferredContactMethods,
  purchaseOrderStatuses,
  repairStatuses,
  rewardTypes,
  stockMovementTypes,
  stockStatuses,
  supportChannels,
  supportMessageDirections,
  supportThreadStatuses,
  workOrderStatuses,
} from "@/types/domain";
import { optionalPhoneInputSchema, phoneInputSchema } from "@/lib/validations/phone";

const adminOperationsPaths = [
  "/admin/operations",
  "/admin/operations/front-desk",
  "/admin/operations/inventory",
  "/admin/operations/workshop",
  "/admin/operations/watch-db",
  "/admin/operations/cashbook",
] as const;

function revalidateOperationsModules() {
  for (const path of adminOperationsPaths) {
    revalidatePath(path);
  }
}

function getAdminReturnPath(formData: FormData, fallback: string) {
  const value = formData.get("returnTo");
  if (typeof value !== "string") {
    return fallback;
  }
  if (!value.startsWith("/admin/")) {
    return fallback;
  }
  return value;
}

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(orderStatuses),
  note: z.string().trim().optional(),
});

const updateOrderPaymentStatusSchema = z.object({
  orderId: z.string().min(1),
  paymentStatus: z.enum(paymentStatuses),
});

const updateOrderNotesSchema = z.object({
  orderId: z.string().min(1),
  internalNotes: z.string().trim().optional(),
});

const updateRepairStatusSchema = z.object({
  repairId: z.string().min(1),
  status: z.enum(repairStatuses),
  note: z.string().trim().optional(),
  visibleToCustomer: z.enum(["true", "false"]).default("false"),
});

const updateRepairNotesSchema = z.object({
  repairId: z.string().min(1),
  internalNotes: z.string().trim().optional(),
  customerNotes: z.string().trim().optional(),
});

const updateRepairEstimateSchema = z.object({
  repairId: z.string().min(1),
  estimatedCompletion: z.string().trim().optional(),
  amountDue: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
});

const upsertProductSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.enum(["watch", "eyewear"]),
  price: z.coerce.number().min(0),
  stockStatus: z.enum(stockStatuses),
  quantity: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  featured: z.enum(["true", "false"]).default("false"),
  isNew: z.enum(["true", "false"]).default("false"),
  primaryCtaMode: z.enum([
    "add_to_cart",
    "reserve_in_store",
    "whatsapp_inquiry",
    "request_availability",
  ]),
  primaryImageUrl: z.string().trim().url().optional(),
  primaryImageAlt: z.string().trim().min(2).optional(),
  imageUrlsRaw: z.string().trim().optional(),
  specsRaw: z.string().trim().optional(),
  status: z.enum(["draft", "active", "archived"]),
  warrantyMonths: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  warrantyTerms: z.string().trim().optional(),
  purchasePrice: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  salePercentage: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).max(100).optional(),
  ),
  campaignSaleOnly: z.enum(["true", "false"]).default("false"),
});

const upsertJournalPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  excerpt: z.string().trim().min(6),
  content: z.string().trim().min(12),
  status: z.enum(journalStatuses),
});

const uploadRepairAttachmentSchema = z.object({
  repairId: z.string().min(1),
  fileLabel: z.string().trim().optional(),
});

const uploadJournalCoverSchema = z.object({
  journalId: z.string().min(1),
});

const uploadProductPrimaryImageSchema = z.object({
  productId: z.string().min(1),
  imageAlt: z.string().trim().min(2).optional(),
});

const uploadProductGalleryImageSchema = z.object({
  productId: z.string().min(1),
  imageAlt: z.string().trim().min(2).optional(),
});

const uploadSiteImageSchema = z.object({
  settingKey: z.string().min(1),
});

const upsertCampaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  status: z.enum(campaignStatuses),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  budget: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
});

const upsertPromotionSchema = z.object({
  id: z.string().optional(),
  campaignId: z.string().trim().optional(),
  name: z.string().trim().min(2),
  status: z.enum(promotionStatuses),
  type: z.enum(promotionTypes),
  scope: z.enum(promotionScopes),
  percentageOff: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).max(100).optional(),
  ),
  amountOff: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).optional(),
  ),
  minOrderTotal: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).optional(),
  ),
  isStackable: z.enum(["true", "false"]).default("false"),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
});

const upsertCouponSchema = z.object({
  id: z.string().optional(),
  promotionId: z.string().min(1),
  code: z.string().trim().min(2),
  status: z.enum(couponStatuses),
  usageLimit: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  perCustomerLimit: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
});

const assignCouponToCustomerSchema = z.object({
  couponId: z.string().min(1),
  customerEmail: z.string().trim().email(),
  status: z.enum(["active", "paused", "expired"]).default("active"),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  maxRedemptions: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
});

const updatePaymentTransactionSchema = z.object({
  transactionId: z.string().min(1),
  status: z.enum(paymentTransactionStatuses),
  note: z.string().trim().optional(),
});

const createSupportThreadSchema = z.object({
  subject: z.string().trim().min(3),
  message: z.string().trim().min(2),
  channel: z.enum(supportChannels).default("web_chat"),
  customerName: z.string().trim().optional(),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: optionalPhoneInputSchema,
});

const createSupportMessageSchema = z.object({
  threadId: z.string().min(1),
  direction: z.enum(supportMessageDirections),
  message: z.string().trim().min(1),
  senderName: z.string().trim().optional(),
  senderEmail: z.string().trim().email().optional().or(z.literal("")),
  senderPhone: optionalPhoneInputSchema,
});

const updateSupportThreadStatusSchema = z.object({
  threadId: z.string().min(1),
  status: z.enum(supportThreadStatuses),
});

const upsertNotificationTemplateSchema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(2),
  title: z.string().trim().min(2),
  channel: z.enum(notificationChannels),
  trigger: z.enum(automationTriggers),
  body: z.string().trim().min(4),
  isActive: z.enum(["true", "false"]).default("true"),
});

const queueNotificationJobSchema = z.object({
  templateId: z.string().trim().optional(),
  customerProfileId: z.string().trim().optional(),
  channel: z.enum(notificationChannels),
  trigger: z.enum(automationTriggers),
  scheduledFor: z.string().trim().optional(),
  payloadJson: z.string().trim().optional(),
});

const upsertSupplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  contactName: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: optionalPhoneInputSchema,
  notes: z.string().trim().optional(),
});

const upsertPurchaseOrderSchema = z.object({
  id: z.string().optional(),
  poNumber: z.string().trim().min(2),
  supplierId: z.string().trim().optional(),
  status: z.enum(purchaseOrderStatuses),
  orderedAt: z.string().trim().optional(),
  receivedAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  subtotal: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  total: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
});

const createStockMovementSchema = z.object({
  productId: z.string().trim().optional(),
  inventoryItemId: z.string().trim().optional(),
  movementType: z.enum(stockMovementTypes),
  quantityDelta: z.coerce.number().int(),
  unitCost: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  referenceType: z.string().trim().optional(),
  referenceId: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

const upsertInventoryItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2),
  name: z.string().trim().min(2),
  itemType: z.enum(inventoryItemTypes),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  caliber: z.string().trim().optional(),
  quantityOnHand: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  reorderLevel: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  unitCost: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  unitPrice: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  active: z.enum(["true", "false"]).default("true"),
});

const createCashbookEntrySchema = z.object({
  entryDate: z.string().trim().optional(),
  entryType: z.enum(cashEntryTypes),
  amount: z.coerce.number().positive(),
  category: z.string().trim().optional(),
  paymentMethod: z.enum(["cash_on_delivery", "pay_in_store", "card_online", "bank_transfer"]).optional(),
  note: z.string().trim().optional(),
  referenceType: z.string().trim().optional(),
  referenceId: z.string().trim().optional(),
});

const createManualOrderItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  sellingPrice: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  rabat: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  rabatType: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.enum(["amount", "percent"]).optional(),
  ),
});

const createManualOrderSchema = z.object({
  customerName: z.string().trim().min(2),
  phone: phoneInputSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  country: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2),
  address: z.string().trim().min(2),
  items: z.array(createManualOrderItemSchema).min(1),
  deliveryMethod: z.enum(deliveryMethods).optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  paymentStatus: z.enum(paymentStatuses).optional(),
  orderStatus: z.enum(orderStatuses).optional(),
  subtotal: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  deliveryFee: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  total: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  notes: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
});

const createManualRepairRequestItemSchema = z.object({
  itemType: z.enum(["watch", "eyewear", "other"]),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  serialNumber: z.string().trim().optional(),
  serviceItemId: z.string().trim().optional(),
  serviceType: z.string().trim().min(2),
  description: z.string().trim().min(6),
});

const createManualRepairRequestSharedSchema = z.object({
  customerName: z.string().trim().min(2),
  phone: phoneInputSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  preferredContactMethod: z.enum(preferredContactMethods).optional(),
  dropOffMethod: z
    .enum(["bring_to_store", "already_dropped_off", "contact_me_first"])
    .optional(),
  status: z.enum(repairStatuses).optional(),
  estimatedCompletion: z.string().trim().optional(),
  amountDue: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  notesInternal: z.string().trim().optional(),
  notesCustomer: z.string().trim().optional(),
});

const upsertWatchBrandSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  country: z.string().trim().optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

const upsertWatchCaliberSchema = z.object({
  id: z.string().optional(),
  brandId: z.string().trim().optional(),
  caliberName: z.string().trim().min(1),
  movementType: z.string().trim().min(1),
  powerReserveHours: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  frequencyBph: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  jewels: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  diameterMm: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  heightMm: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  hasHacking: z.enum(["true", "false"]).default("false"),
  hasHandWinding: z.enum(["true", "false"]).default("false"),
  notes: z.string().trim().optional(),
});

const upsertWatchModelSchema = z.object({
  id: z.string().optional(),
  brandId: z.string().trim().optional(),
  modelName: z.string().trim().min(1),
  collection: z.string().trim().optional(),
  targetGender: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const upsertWatchReferenceSchema = z.object({
  id: z.string().optional(),
  modelId: z.string().trim().min(1),
  referenceCode: z.string().trim().min(1),
  caliberId: z.string().trim().optional(),
  caseSizeMm: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  lugWidthMm: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  waterResistanceM: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().nonnegative().optional(),
  ),
  crystal: z.string().trim().optional(),
  caseMaterial: z.string().trim().optional(),
  dialColor: z.string().trim().optional(),
  strapType: z.string().trim().optional(),
  productionFromYear: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1900).max(2200).optional(),
  ),
  productionToYear: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1900).max(2200).optional(),
  ),
  notes: z.string().trim().optional(),
});

const upsertInventoryCompatibilitySchema = z
  .object({
    id: z.string().optional(),
    inventoryItemId: z.string().trim().min(1),
    caliberId: z.string().trim().optional(),
    modelId: z.string().trim().optional(),
    referenceId: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.caliberId && !data.modelId && !data.referenceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["referenceId"],
        message: "Select at least one compatibility target.",
      });
    }
  });

const createRepairPartUsageSchema = z.object({
  workOrderId: z.string().trim().min(1),
  inventoryItemId: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  note: z.string().trim().optional(),
});

const upsertWorkOrderSchema = z.object({
  id: z.string().optional(),
  repairRequestId: z.string().trim().min(1),
  status: z.enum(workOrderStatuses),
  diagnosis: z.string().trim().optional(),
  estimateAmount: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative().optional(),
  ),
  approvedByCustomer: z.enum(["true", "false"]).default("false"),
  startedAt: z.string().trim().optional(),
  completedAt: z.string().trim().optional(),
});

const upsertLoyaltyRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  pointsPerEur: z.coerce.number().min(0),
  minRedeemPoints: z.coerce.number().int().min(0),
  rewardType: z.enum(rewardTypes),
  active: z.enum(["true", "false"]).default("true"),
});

const upsertAffiliateSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal("")),
  code: z.string().trim().min(2),
  status: z.enum(affiliateStatuses),
  commissionRate: z.coerce.number().min(0).max(1),
  notes: z.string().trim().optional(),
});

const upsertAffiliatePayoutSchema = z.object({
  id: z.string().optional(),
  affiliateId: z.string().min(1),
  periodStart: z.string().trim().optional(),
  periodEnd: z.string().trim().optional(),
  amount: z.coerce.number().nonnegative(),
  status: z.enum(payoutStatuses),
  paidAt: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});


function parseSpecsRaw(specsRaw?: string) {
  if (!specsRaw) {
    return [];
  }

  return specsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return null;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key || !value) {
        return null;
      }
      return { key, value };
    })
    .filter((entry): entry is { key: string; value: string } => Boolean(entry));
}

function parseImageUrlsRaw(imageUrlsRaw?: string) {
  if (imageUrlsRaw === undefined) {
    return undefined;
  }

  if (!imageUrlsRaw) {
    return [];
  }

  const urls = imageUrlsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    });

  return Array.from(new Set(urls));
}

function parseJsonObject(raw?: string) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function parseLegacyStringArray(raw?: string) {
  if (!raw) {
    return [] as string[];
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => String(entry).trim())
        .filter(Boolean);
    }
  } catch {
    // fallback to newline parsing
  }

  return trimmed
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getStringArraySetting(
  formData: FormData,
  listFieldName: string,
  legacyFieldName: string,
) {
  const listValues = formData
    .getAll(listFieldName)
    .map((entry) => String(entry).trim())
    .filter(Boolean);

  if (listValues.length > 0) {
    return JSON.stringify(listValues.slice(0, 24));
  }

  const legacyRaw = String(formData.get(legacyFieldName) ?? "");
  return JSON.stringify(parseLegacyStringArray(legacyRaw).slice(0, 24));
}

export async function updateOrderStatusAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateOrderStatusSchema.parse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });

  await updateAdminOrderStatus(payload.orderId, payload.status, payload.note ?? null);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/operations/cashbook");
}

export async function updateOrderPaymentStatusAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateOrderPaymentStatusSchema.parse({
    orderId: formData.get("orderId"),
    paymentStatus: formData.get("paymentStatus"),
  });

  await updateAdminOrderPaymentStatus(payload.orderId, payload.paymentStatus);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/operations/cashbook");
}

export async function updateOrderNotesAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateOrderNotesSchema.parse({
    orderId: formData.get("orderId"),
    internalNotes: formData.get("internalNotes"),
  });

  await updateAdminOrderInternalNotes(payload.orderId, payload.internalNotes ?? "");
  revalidatePath("/admin/orders");
}

export async function updateRepairStatusAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateRepairStatusSchema.parse({
    repairId: formData.get("repairId"),
    status: formData.get("status"),
    note: formData.get("note"),
    visibleToCustomer: formData.get("visibleToCustomer"),
  });

  await updateAdminRepairStatus(
    payload.repairId,
    payload.status,
    payload.note ?? null,
    payload.visibleToCustomer === "true",
  );
  revalidatePath("/admin");
  revalidatePath("/admin/repairs");
}

export async function updateRepairNotesAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateRepairNotesSchema.parse({
    repairId: formData.get("repairId"),
    internalNotes: formData.get("internalNotes"),
    customerNotes: formData.get("customerNotes"),
  });

  await updateAdminRepairNotes(
    payload.repairId,
    payload.internalNotes ?? "",
    payload.customerNotes ?? "",
  );
  revalidatePath("/admin/repairs");
}

export async function updateRepairEstimateAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateRepairEstimateSchema.parse({
    repairId: formData.get("repairId"),
    estimatedCompletion: formData.get("estimatedCompletion"),
    amountDue: formData.get("amountDue"),
  });

  await updateAdminRepairEstimate(
    payload.repairId,
    payload.estimatedCompletion ?? "",
    payload.amountDue ?? null,
  );
  revalidatePath("/admin/repairs");
}

export async function upsertProductAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertProductSchema.parse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    brand: formData.get("brand"),
    category: formData.get("category"),
    price: formData.get("price"),
    stockStatus: formData.get("stockStatus"),
    quantity: formData.get("quantity"),
    featured: formData.get("featured") ? "true" : "false",
    isNew: formData.get("isNew") ? "true" : "false",
    primaryCtaMode: formData.get("primaryCtaMode"),
    primaryImageUrl: formData.get("primaryImageUrl") || undefined,
    primaryImageAlt: formData.get("primaryImageAlt") || undefined,
    imageUrlsRaw: formData.get("imageUrlsRaw") || undefined,
    specsRaw: formData.get("specsRaw") || undefined,
    status: formData.get("status"),
    warrantyMonths: formData.get("warrantyMonths") || undefined,
    warrantyTerms: formData.get("warrantyTerms") || undefined,
    purchasePrice: formData.get("purchasePrice") || undefined,
    salePercentage: formData.get("salePercentage") || undefined,
    campaignSaleOnly: formData.get("campaignSaleOnly") ? "true" : "false",
  });

  await upsertAdminProduct({
    id: payload.id,
    title: payload.title,
    brand: payload.brand,
    category: payload.category,
    price: payload.price,
    stockStatus: payload.stockStatus,
    quantity: payload.quantity ?? null,
    featured: payload.featured === "true",
    isNew: payload.isNew === "true",
    primaryCtaMode: payload.primaryCtaMode,
    primaryImageUrl: payload.primaryImageUrl ?? null,
    primaryImageAlt: payload.primaryImageAlt ?? null,
    imageUrls: parseImageUrlsRaw(payload.imageUrlsRaw),
    specs: parseSpecsRaw(payload.specsRaw),
    status: payload.status,
    warrantyMonths: payload.warrantyMonths ?? 0,
    warrantyTerms: payload.warrantyTerms ?? null,
    purchasePrice: payload.purchasePrice ?? null,
    salePercentage: payload.salePercentage ?? null,
    campaignSaleOnly: payload.campaignSaleOnly === "true",
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
}

export async function saveSiteSettingsAction(formData: FormData) {
  await verifyAdminSession();
  const scalarKeys = [
    "business.name",
    "hero.headline",
    "hero.subheadline",
    "hero.primary_cta_label",
    "hero.primary_cta_href",
    "hero.secondary_cta_label",
    "hero.secondary_cta_href",
    "store.address",
    "store.hours",
    "store.phone",
    "store.email",
    "store.whatsapp",
    "store.map_url",
    "about.intro",
    "about.story",
    "seo.default_title",
    "seo.default_description",
    "seo.default_image",
    "commerce.delivery_fee_home",
  ] as const;

  for (const key of scalarKeys) {
    const value = String(formData.get(key) ?? "");
    await updateAdminSiteSetting(key, value);
  }

  await updateAdminSiteSetting(
    "about.values",
    getStringArraySetting(formData, "about.values[]", "about.values"),
  );
  await updateAdminSiteSetting(
    "home.trust_points",
    getStringArraySetting(formData, "home.trust_points[]", "home.trust_points"),
  );
  await updateAdminSiteSetting(
    "home.service_highlights",
    getStringArraySetting(
      formData,
      "home.service_highlights[]",
      "home.service_highlights",
    ),
  );

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/service");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
}

export async function uploadRepairAttachmentAction(formData: FormData) {
  await verifyAdminSession();
  const payload = uploadRepairAttachmentSchema.parse({
    repairId: formData.get("repairId"),
    fileLabel: formData.get("fileLabel"),
  });

  const rawFile = formData.get("attachment");
  const validation = validateUploadFile(rawFile);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  const file = rawFile as File;

  const fileBytes = await getFileBytes(file);
  await addAdminRepairAttachment({
    repairId: payload.repairId,
    fileName: file.name,
    fileType: file.type,
    fileBytes,
    fileLabel: payload.fileLabel ?? null,
  });

  revalidatePath("/admin/repairs");
}

export async function upsertJournalPostAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertJournalPostSchema.parse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    status: formData.get("status"),
  });

  await upsertAdminJournalPost(payload);

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath(`/journal/${payload.slug}`);
}

export async function uploadJournalCoverImageAction(formData: FormData) {
  await verifyAdminSession();
  const payload = uploadJournalCoverSchema.parse({
    journalId: formData.get("journalId"),
  });

  const rawFile = formData.get("coverImage");
  const validation = validateUploadFile(rawFile, { requireImage: true });
  if (!validation.success) {
    throw new Error(validation.error);
  }
  const file = rawFile as File;

  const fileBytes = await getFileBytes(file);
  await uploadAdminJournalCoverImage({
    journalId: payload.journalId,
    fileName: file.name,
    fileType: file.type,
    fileBytes,
  });

  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath("/journal/[slug]", "page");
}

export async function uploadProductPrimaryImageAction(formData: FormData) {
  await verifyAdminSession();
  const payload = uploadProductPrimaryImageSchema.parse({
    productId: formData.get("productId"),
    imageAlt: formData.get("imageAlt") || undefined,
  });

  const rawFile = formData.get("primaryImageFile");
  const validation = validateUploadFile(rawFile, { requireImage: true });
  if (!validation.success) {
    throw new Error(validation.error);
  }
  const file = rawFile as File;

  const fileBytes = await getFileBytes(file);
  await uploadAdminProductPrimaryImage({
    productId: payload.productId,
    imageAlt: payload.imageAlt ?? null,
    fileName: file.name,
    fileType: file.type,
    fileBytes,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
  revalidatePath("/products/[slug]", "page");
}

export async function uploadProductGalleryImageAction(formData: FormData) {
  await verifyAdminSession();
  const payload = uploadProductGalleryImageSchema.parse({
    productId: formData.get("productId"),
    imageAlt: formData.get("imageAlt") || undefined,
  });

  const rawFile = formData.get("galleryImageFile");
  const validation = validateUploadFile(rawFile, { requireImage: true });
  if (!validation.success) {
    throw new Error(validation.error);
  }
  const file = rawFile as File;

  const fileBytes = await getFileBytes(file);
  await uploadAdminProductGalleryImage({
    productId: payload.productId,
    imageAlt: payload.imageAlt ?? null,
    fileName: file.name,
    fileType: file.type,
    fileBytes,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
  revalidatePath("/products/[slug]", "page");
}

export async function deleteProductImageAction(formData: FormData) {
  await verifyAdminSession();
  const productId = z.string().min(1).parse(formData.get("productId"));
  const imageUrl = z.string().url().parse(formData.get("imageUrl"));
  await deleteAdminProductImage(productId, imageUrl);
  revalidatePath("/admin/products");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
  revalidatePath("/products/[slug]", "page");
}

export async function addProductImageUrlAction(formData: FormData) {
  await verifyAdminSession();
  const productId = z.string().min(1).parse(formData.get("productId"));
  const imageUrl = z.string().url().parse(formData.get("imageUrl"));
  const imageAlt = z.string().trim().optional().parse(formData.get("imageAlt") || undefined);
  await addAdminProductImageUrl(productId, imageUrl, imageAlt ?? "");
  revalidatePath("/admin/products");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
  revalidatePath("/products/[slug]", "page");
}

export async function uploadSiteImageAction(formData: FormData) {
  await verifyAdminSession();
  const payload = uploadSiteImageSchema.parse({
    settingKey: formData.get("settingKey"),
  });

  const rawFile = formData.get("siteImageFile");
  const validation = validateUploadFile(rawFile, { requireImage: true });
  if (!validation.success) {
    throw new Error(validation.error);
  }
  const file = rawFile as File;

  const fileBytes = await getFileBytes(file);
  await uploadAdminSiteImage({
    settingKey: payload.settingKey,
    fileName: file.name,
    fileType: file.type,
    fileBytes,
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/content");
}

export async function upsertCampaignAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertCampaignSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
    budget: formData.get("budget"),
  });

  await upsertAdminCampaign(payload);
  revalidatePath("/admin/marketing");
}

export async function upsertPromotionAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertPromotionSchema.parse({
    id: formData.get("id") || undefined,
    campaignId: formData.get("campaignId") || undefined,
    name: formData.get("name"),
    status: formData.get("status"),
    type: formData.get("type"),
    scope: formData.get("scope"),
    percentageOff: formData.get("percentageOff"),
    amountOff: formData.get("amountOff"),
    minOrderTotal: formData.get("minOrderTotal"),
    isStackable: formData.get("isStackable") ? "true" : "false",
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
  });

  await upsertAdminPromotion({
    ...payload,
    campaignId: payload.campaignId || null,
    isStackable: payload.isStackable === "true",
  });
  revalidatePath("/admin/marketing");
}

export async function upsertCouponAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertCouponSchema.parse({
    id: formData.get("id") || undefined,
    promotionId: formData.get("promotionId"),
    code: formData.get("code"),
    status: formData.get("status"),
    usageLimit: formData.get("usageLimit"),
    perCustomerLimit: formData.get("perCustomerLimit"),
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
  });

  await upsertAdminCoupon(payload);
  revalidatePath("/admin/marketing");
}

export async function assignCouponToCustomerAction(formData: FormData) {
  await verifyAdminSession();
  const payload = assignCouponToCustomerSchema.parse({
    couponId: formData.get("couponId"),
    customerEmail: formData.get("customerEmail"),
    status: formData.get("status") || "active",
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
    maxRedemptions: formData.get("maxRedemptions"),
  });

  await assignCouponToCustomerByEmail({
    couponId: payload.couponId,
    email: payload.customerEmail,
    status: payload.status,
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null,
    maxRedemptions: payload.maxRedemptions ?? null,
  });

  revalidatePath("/admin/marketing");
}

export async function updatePaymentTransactionStatusAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updatePaymentTransactionSchema.parse({
    transactionId: formData.get("transactionId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });

  await updateAdminPaymentTransactionStatus(
    payload.transactionId,
    payload.status,
    payload.note ?? null,
  );
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/operations/cashbook");
}

export async function createSupportThreadAction(formData: FormData) {
  await verifyAdminSession();
  const payload = createSupportThreadSchema.parse({
    subject: formData.get("subject"),
    message: formData.get("message"),
    channel: formData.get("channel"),
    customerName: formData.get("customerName") || undefined,
    customerEmail: formData.get("customerEmail") || undefined,
    customerPhone: formData.get("customerPhone") || undefined,
  });

  await createSupportThread({
    subject: payload.subject,
    message: payload.message,
    channel: payload.channel,
    customerName: payload.customerName ?? null,
    customerEmail: payload.customerEmail || null,
    customerPhone: payload.customerPhone ?? null,
  });

  revalidatePath("/admin/support");
}

export async function createSupportMessageAction(formData: FormData) {
  await verifyAdminSession();
  const payload = createSupportMessageSchema.parse({
    threadId: formData.get("threadId"),
    direction: formData.get("direction"),
    message: formData.get("message"),
    senderName: formData.get("senderName") || undefined,
    senderEmail: formData.get("senderEmail") || undefined,
    senderPhone: formData.get("senderPhone") || undefined,
  });

  await addSupportMessage({
    threadId: payload.threadId,
    direction: payload.direction,
    message: payload.message,
    senderName: payload.senderName ?? null,
    senderEmail: payload.senderEmail || null,
    senderPhone: payload.senderPhone ?? null,
  });

  revalidatePath("/admin/support");
}

export async function updateSupportThreadStatusAction(formData: FormData) {
  await verifyAdminSession();
  const payload = updateSupportThreadStatusSchema.parse({
    threadId: formData.get("threadId"),
    status: formData.get("status"),
  });

  await updateSupportThreadStatus(payload.threadId, payload.status);
  revalidatePath("/admin/support");
}

export async function upsertNotificationTemplateAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertNotificationTemplateSchema.parse({
    id: formData.get("id") || undefined,
    key: formData.get("key"),
    title: formData.get("title"),
    channel: formData.get("channel"),
    trigger: formData.get("trigger"),
    body: formData.get("body"),
    isActive: formData.get("isActive") ? "true" : "false",
  });

  await upsertAdminNotificationTemplate({
    ...payload,
    isActive: payload.isActive === "true",
  });
  revalidatePath("/admin/support");
}

export async function queueNotificationJobAction(formData: FormData) {
  await verifyAdminSession();
  const payload = queueNotificationJobSchema.parse({
    templateId: formData.get("templateId") || undefined,
    customerProfileId: formData.get("customerProfileId") || undefined,
    channel: formData.get("channel"),
    trigger: formData.get("trigger"),
    scheduledFor: formData.get("scheduledFor") || undefined,
    payloadJson: formData.get("payloadJson") || undefined,
  });

  await queueNotificationJob({
    templateId: payload.templateId || null,
    customerProfileId: payload.customerProfileId || null,
    channel: payload.channel,
    trigger: payload.trigger,
    scheduledFor: payload.scheduledFor || null,
    payload: parseJsonObject(payload.payloadJson),
  });
  revalidatePath("/admin/support");
}

export async function upsertSupplierAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/inventory");
  const payload = upsertSupplierSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminSupplier({
    ...payload,
    email: payload.email || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function upsertPurchaseOrderAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/inventory");
  const payload = upsertPurchaseOrderSchema.parse({
    id: formData.get("id") || undefined,
    poNumber: formData.get("poNumber"),
    supplierId: formData.get("supplierId") || undefined,
    status: formData.get("status"),
    orderedAt: formData.get("orderedAt") || undefined,
    receivedAt: formData.get("receivedAt") || undefined,
    notes: formData.get("notes") || undefined,
    subtotal: formData.get("subtotal"),
    total: formData.get("total"),
  });

  await upsertAdminPurchaseOrder({
    ...payload,
    supplierId: payload.supplierId || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function createStockMovementAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/inventory");
  const payload = createStockMovementSchema.parse({
    productId: formData.get("productId") || undefined,
    inventoryItemId: formData.get("inventoryItemId") || undefined,
    movementType: formData.get("movementType"),
    quantityDelta: formData.get("quantityDelta"),
    unitCost: formData.get("unitCost"),
    referenceType: formData.get("referenceType") || undefined,
    referenceId: formData.get("referenceId") || undefined,
    note: formData.get("note") || undefined,
  });

  await createStockMovement({
    ...payload,
    productId: payload.productId || null,
    inventoryItemId: payload.inventoryItemId || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
  revalidatePath("/admin/products");
}

export async function upsertInventoryItemAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/inventory");
  const payload = upsertInventoryItemSchema.parse({
    id: formData.get("id") || undefined,
    sku: formData.get("sku"),
    name: formData.get("name"),
    itemType: formData.get("itemType"),
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    caliber: formData.get("caliber") || undefined,
    quantityOnHand: formData.get("quantityOnHand"),
    reorderLevel: formData.get("reorderLevel"),
    unitCost: formData.get("unitCost"),
    unitPrice: formData.get("unitPrice"),
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    active: formData.get("active") ? "true" : "false",
  });

  await upsertAdminInventoryItem({
    ...payload,
    active: payload.active === "true",
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function createCashbookEntryAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/cashbook");
  const payload = createCashbookEntrySchema.parse({
    entryDate: formData.get("entryDate") || undefined,
    entryType: formData.get("entryType"),
    amount: formData.get("amount"),
    category: formData.get("category") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    note: formData.get("note") || undefined,
    referenceType: formData.get("referenceType") || undefined,
    referenceId: formData.get("referenceId") || undefined,
  });

  await createAdminCashbookEntry(payload);
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function createManualOrderAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/front-desk");
  const itemProductIds = formData
    .getAll("itemProductId")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  const itemQuantities = formData
    .getAll("itemQuantity")
    .map((value) => (typeof value === "string" ? value : ""));
  const itemSellingPrices = formData
    .getAll("itemSellingPrice")
    .map((value) => (typeof value === "string" ? value : ""));
  const itemRabats = formData
    .getAll("itemRabat")
    .map((value) => (typeof value === "string" ? value : ""));
  const itemRabatTypes = formData
    .getAll("itemRabatType")
    .map((value) => (typeof value === "string" ? value : ""));

  const items = itemProductIds.map((productId, index) => ({
    productId,
    quantity: itemQuantities[index] || undefined,
    sellingPrice: itemSellingPrices[index] || undefined,
    rabat: itemRabats[index] || undefined,
    rabatType: itemRabatTypes[index] || undefined,
  })).filter((item) => item.productId.length > 0);

  const payload = createManualOrderSchema.parse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city"),
    address: formData.get("address"),
    items,
    deliveryMethod: formData.get("deliveryMethod"),
    paymentMethod: formData.get("paymentMethod"),
    paymentStatus: formData.get("paymentStatus") || undefined,
    orderStatus: formData.get("orderStatus") || undefined,
    subtotal: formData.get("subtotal"),
    deliveryFee: formData.get("deliveryFee"),
    total: formData.get("total"),
    notes: formData.get("notes") || undefined,
    internalNotes: formData.get("internalNotes") || undefined,
  });

  await createManualAdminOrder({
    ...payload,
    email: payload.email || null,
    country: payload.country || "Kosovo",
    deliveryMethod: payload.deliveryMethod ?? "home_delivery",
    paymentMethod: payload.paymentMethod ?? "cash_on_delivery",
    paymentStatus: payload.paymentStatus ?? "pending",
    orderStatus: payload.orderStatus ?? "pending",
  });
  revalidateOperationsModules();
  revalidatePath("/admin/orders");
  redirect(returnTo);
}

export async function createManualRepairRequestAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/front-desk");
  const sharedPayload = createManualRepairRequestSharedSchema.parse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    preferredContactMethod: formData.get("preferredContactMethod"),
    dropOffMethod: formData.get("dropOffMethod"),
    status: formData.get("status") || undefined,
    estimatedCompletion: formData.get("estimatedCompletion") || undefined,
    amountDue: formData.get("amountDue"),
    notesInternal: formData.get("notesInternal") || undefined,
    notesCustomer: formData.get("notesCustomer") || undefined,
  });

  const itemTypes = formData
    .getAll("serviceItemType")
    .map((value) => (typeof value === "string" ? value : ""));
  const brands = formData
    .getAll("serviceItemBrand")
    .map((value) => (typeof value === "string" ? value : ""));
  const models = formData
    .getAll("serviceItemModel")
    .map((value) => (typeof value === "string" ? value : ""));
  const serialNumbers = formData
    .getAll("serviceItemSerialNumber")
    .map((value) => (typeof value === "string" ? value : ""));
  const serviceItemIds = formData
    .getAll("serviceItemId")
    .map((value) => (typeof value === "string" ? value : ""));
  const serviceTypes = formData
    .getAll("serviceItemServiceType")
    .map((value) => (typeof value === "string" ? value : ""));
  const descriptions = formData
    .getAll("serviceItemDescription")
    .map((value) => (typeof value === "string" ? value : ""));

  const itemPayloadRaw =
    itemTypes.length > 0
      ? itemTypes.map((itemType, index) => ({
          itemType,
          brand: brands[index] || "",
          model: models[index] || "",
          serialNumber: serialNumbers[index] || undefined,
          serviceItemId: serviceItemIds[index] || undefined,
          serviceType: serviceTypes[index] || "",
          description: descriptions[index] || "",
        }))
      : [
          {
            itemType: formData.get("itemType"),
            brand: formData.get("brand"),
            model: formData.get("model"),
            serviceType: formData.get("serviceType"),
            description: formData.get("description"),
          },
        ];

  const itemPayloads = z.array(createManualRepairRequestItemSchema).min(1).parse(itemPayloadRaw);

  for (const itemPayload of itemPayloads) {
    // Find or create the physical item record for history tracking
    const serviceItemId = await upsertServiceItem({
      serviceItemId: itemPayload.serviceItemId || null,
      itemType: itemPayload.itemType,
      brand: itemPayload.brand,
      model: itemPayload.model,
      serialNumber: itemPayload.serialNumber || null,
    });

    await createManualAdminRepairRequest({
      ...sharedPayload,
      ...itemPayload,
      serialNumber: itemPayload.serialNumber || null,
      serviceItemId,
      email: sharedPayload.email || null,
      preferredContactMethod: sharedPayload.preferredContactMethod ?? "phone",
      dropOffMethod: sharedPayload.dropOffMethod ?? "already_dropped_off",
      estimatedCompletion: sharedPayload.estimatedCompletion || null,
      status: sharedPayload.status ?? "request_received",
    });
  }
  revalidateOperationsModules();
  revalidatePath("/admin/repairs");
  redirect(returnTo);
}

export async function upsertWatchBrandAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/watch-db");
  const payload = upsertWatchBrandSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    country: formData.get("country") || undefined,
    website: formData.get("website") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminWatchBrand({
    ...payload,
    country: payload.country || null,
    website: payload.website || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function upsertWatchCaliberAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/watch-db");
  const payload = upsertWatchCaliberSchema.parse({
    id: formData.get("id") || undefined,
    brandId: formData.get("brandId") || undefined,
    caliberName: formData.get("caliberName"),
    movementType: formData.get("movementType"),
    powerReserveHours: formData.get("powerReserveHours"),
    frequencyBph: formData.get("frequencyBph"),
    jewels: formData.get("jewels"),
    diameterMm: formData.get("diameterMm"),
    heightMm: formData.get("heightMm"),
    hasHacking: formData.get("hasHacking") ? "true" : "false",
    hasHandWinding: formData.get("hasHandWinding") ? "true" : "false",
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminWatchCaliber({
    ...payload,
    brandId: payload.brandId || null,
    hasHacking: payload.hasHacking === "true",
    hasHandWinding: payload.hasHandWinding === "true",
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function upsertWatchModelAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/watch-db");
  const payload = upsertWatchModelSchema.parse({
    id: formData.get("id") || undefined,
    brandId: formData.get("brandId") || undefined,
    modelName: formData.get("modelName"),
    collection: formData.get("collection") || undefined,
    targetGender: formData.get("targetGender") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminWatchModel({
    ...payload,
    brandId: payload.brandId || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function upsertWatchReferenceAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/watch-db");
  const payload = upsertWatchReferenceSchema.parse({
    id: formData.get("id") || undefined,
    modelId: formData.get("modelId"),
    referenceCode: formData.get("referenceCode"),
    caliberId: formData.get("caliberId") || undefined,
    caseSizeMm: formData.get("caseSizeMm"),
    lugWidthMm: formData.get("lugWidthMm"),
    waterResistanceM: formData.get("waterResistanceM"),
    crystal: formData.get("crystal") || undefined,
    caseMaterial: formData.get("caseMaterial") || undefined,
    dialColor: formData.get("dialColor") || undefined,
    strapType: formData.get("strapType") || undefined,
    productionFromYear: formData.get("productionFromYear"),
    productionToYear: formData.get("productionToYear"),
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminWatchReference({
    ...payload,
    caliberId: payload.caliberId || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function upsertInventoryCompatibilityAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/watch-db");
  const payload = upsertInventoryCompatibilitySchema.parse({
    id: formData.get("id") || undefined,
    inventoryItemId: formData.get("inventoryItemId"),
    caliberId: formData.get("caliberId") || undefined,
    modelId: formData.get("modelId") || undefined,
    referenceId: formData.get("referenceId") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminInventoryCompatibility({
    ...payload,
    caliberId: payload.caliberId || null,
    modelId: payload.modelId || null,
    referenceId: payload.referenceId || null,
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function createRepairPartUsageAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/workshop");
  const usageWorkOrderIds = formData
    .getAll("usageWorkOrderId")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  const usageInventoryItemIds = formData
    .getAll("usageInventoryItemId")
    .map((value) => (typeof value === "string" ? value.trim() : ""));
  const usageQuantities = formData
    .getAll("usageQuantity")
    .map((value) => (typeof value === "string" ? value : ""));
  const usageUnitCosts = formData
    .getAll("usageUnitCost")
    .map((value) => (typeof value === "string" ? value : ""));
  const usageNotes = formData
    .getAll("usageNote")
    .map((value) => (typeof value === "string" ? value : ""));

  const linesRaw =
    usageWorkOrderIds.length > 0
      ? usageWorkOrderIds.map((workOrderId, index) => ({
          workOrderId,
          inventoryItemId: usageInventoryItemIds[index] || "",
          quantity: usageQuantities[index] || "",
          unitCost: usageUnitCosts[index] || undefined,
          note: usageNotes[index] || undefined,
        }))
      : [
          {
            workOrderId: formData.get("workOrderId"),
            inventoryItemId: formData.get("inventoryItemId"),
            quantity: formData.get("quantity"),
            unitCost: formData.get("unitCost"),
            note: formData.get("note") || undefined,
          },
        ];

  const payloadLines = z.array(createRepairPartUsageSchema).min(1).parse(linesRaw);

  for (const payload of payloadLines) {
    await createAdminRepairPartUsage(payload);
  }
  revalidatePath(returnTo);
  revalidateOperationsModules();
}

export async function upsertWorkOrderAction(formData: FormData) {
  await verifyAdminSession();
  const returnTo = getAdminReturnPath(formData, "/admin/operations/workshop");
  const payload = upsertWorkOrderSchema.parse({
    id: formData.get("id") || undefined,
    repairRequestId: formData.get("repairRequestId"),
    status: formData.get("status"),
    diagnosis: formData.get("diagnosis") || undefined,
    estimateAmount: formData.get("estimateAmount"),
    approvedByCustomer: formData.get("approvedByCustomer") ? "true" : "false",
    startedAt: formData.get("startedAt") || undefined,
    completedAt: formData.get("completedAt") || undefined,
  });

  await upsertAdminWorkOrder({
    ...payload,
    approvedByCustomer: payload.approvedByCustomer === "true",
  });
  revalidatePath(returnTo);
  revalidateOperationsModules();
  revalidatePath("/admin/repairs");
}

export async function upsertLoyaltyRuleAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertLoyaltyRuleSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    pointsPerEur: formData.get("pointsPerEur"),
    minRedeemPoints: formData.get("minRedeemPoints"),
    rewardType: formData.get("rewardType"),
    active: formData.get("active") ? "true" : "false",
  });

  await upsertAdminLoyaltyRule({
    ...payload,
    active: payload.active === "true",
  });
  revalidatePath("/admin/growth");
}

export async function upsertAffiliateAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertAffiliateSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    code: formData.get("code"),
    status: formData.get("status"),
    commissionRate: formData.get("commissionRate"),
    notes: formData.get("notes") || undefined,
  });

  await upsertAdminAffiliate({
    ...payload,
    email: payload.email || null,
  });
  revalidatePath("/admin/growth");
}

export async function upsertAffiliatePayoutAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertAffiliatePayoutSchema.parse({
    id: formData.get("id") || undefined,
    affiliateId: formData.get("affiliateId"),
    periodStart: formData.get("periodStart") || undefined,
    periodEnd: formData.get("periodEnd") || undefined,
    amount: formData.get("amount"),
    status: formData.get("status"),
    paidAt: formData.get("paidAt") || undefined,
    reference: formData.get("reference") || undefined,
  });

  await upsertAdminAffiliatePayout(payload);
  revalidatePath("/admin/growth");
}

const upsertHeroSlideSchema = z.object({
  id: z.string().optional(),
  slideType: z.enum(heroSlideTypes),
  status: z.enum(heroSlideStatuses),
  sortOrder: z.coerce.number().int().nonnegative(),
  headline: z.string().trim().optional(),
  subheadline: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  ctaHref: z.string().trim().optional(),
  secondaryCtaLabel: z.string().trim().optional(),
  secondaryCtaHref: z.string().trim().optional(),
  backgroundImageUrl: z.string().trim().optional(),
  backgroundImageAlt: z.string().trim().optional(),
  videoUrl: z.string().trim().optional(),
  videoPosterUrl: z.string().trim().optional(),
  productId: z.string().trim().optional(),
});

const deleteHeroSlideSchema = z.object({
  slideId: z.string().min(1),
});

const uploadHeroSlideImageSchema = z.object({
  slideId: z.string().min(1),
  imageField: z.enum(["backgroundImage", "videoPoster", "video"]),
});

export async function upsertHeroSlideAction(formData: FormData) {
  await verifyAdminSession();
  const payload = upsertHeroSlideSchema.parse({
    id: formData.get("id") || undefined,
    slideType: formData.get("slideType"),
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder"),
    headline: formData.get("headline") || undefined,
    subheadline: formData.get("subheadline") || undefined,
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaHref: formData.get("ctaHref") || undefined,
    secondaryCtaLabel: formData.get("secondaryCtaLabel") || undefined,
    secondaryCtaHref: formData.get("secondaryCtaHref") || undefined,
    backgroundImageUrl: formData.get("backgroundImageUrl") || undefined,
    backgroundImageAlt: formData.get("backgroundImageAlt") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    videoPosterUrl: formData.get("videoPosterUrl") || undefined,
    productId: formData.get("productId") || undefined,
  });

  const slideId = await upsertAdminHeroSlide({
    id: payload.id,
    slideType: payload.slideType,
    status: payload.status,
    sortOrder: payload.sortOrder,
    headline: payload.headline ?? null,
    subheadline: payload.subheadline ?? null,
    ctaLabel: payload.ctaLabel ?? null,
    ctaHref: payload.ctaHref ?? null,
    secondaryCtaLabel: payload.secondaryCtaLabel ?? null,
    secondaryCtaHref: payload.secondaryCtaHref ?? null,
    backgroundImageUrl: payload.backgroundImageUrl ?? null,
    backgroundImageAlt: payload.backgroundImageAlt ?? null,
    videoUrl: payload.videoUrl ?? null,
    videoPosterUrl: payload.videoPosterUrl ?? null,
    productId: payload.productId ?? null,
  });

  // Handle inline file uploads (background image, video poster, video)
  const uploadTargets = ["backgroundImage", "videoPoster", "video"] as const;
  for (const field of uploadTargets) {
    const file = formData.get(`${field}File`);
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
      continue;
    }
    const isVideo = field === "video";
    if (!file.type.startsWith(isVideo ? "video/" : "image/")) {
      continue;
    }
    const fileBytes = await getFileBytes(file as File);
    await uploadAdminHeroSlideImage({
      slideId,
      imageField: field,
      fileName: file.name,
      fileType: file.type,
      fileBytes,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/hero-slides");
}

export async function deleteHeroSlideAction(formData: FormData) {
  await verifyAdminSession();
  const payload = deleteHeroSlideSchema.parse({
    slideId: formData.get("slideId"),
  });

  await deleteAdminHeroSlide(payload.slideId);
  revalidatePath("/");
  revalidatePath("/admin/hero-slides");
}

export async function uploadHeroSlideImageAction(formData: FormData) {
  await verifyAdminSession();
  const payload = uploadHeroSlideImageSchema.parse({
    slideId: formData.get("slideId"),
    imageField: formData.get("imageField"),
  });

  const rawFile = formData.get("imageFile");
  const isVideo = payload.imageField === "video";
  const validation = validateUploadFile(rawFile, { requireImage: !isVideo });
  if (!validation.success) {
    throw new Error(validation.error);
  }
  const file = rawFile as File;

  const fileBytes = await getFileBytes(file);
  await uploadAdminHeroSlideImage({
    slideId: payload.slideId,
    imageField: payload.imageField,
    fileName: file.name,
    fileType: file.type,
    fileBytes,
  });

  revalidatePath("/");
  revalidatePath("/admin/hero-slides");
}
