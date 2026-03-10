"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  addAdminRepairAttachment,
  updateAdminOrderInternalNotes,
  updateAdminOrderStatus,
  updateAdminRepairEstimate,
  updateAdminRepairNotes,
  updateAdminRepairStatus,
  updateAdminSiteSetting,
  uploadAdminProductPrimaryImage,
  uploadAdminJournalCoverImage,
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
  createStockMovement,
  upsertAdminPurchaseOrder,
  upsertAdminSupplier,
  upsertAdminWorkOrder,
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
  campaignStatuses,
  couponStatuses,
  journalStatuses,
  notificationChannels,
  orderStatuses,
  paymentTransactionStatuses,
  payoutStatuses,
  promotionScopes,
  promotionStatuses,
  promotionTypes,
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

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(orderStatuses),
  note: z.string().trim().optional(),
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
  customerPhone: z.string().trim().optional(),
});

const createSupportMessageSchema = z.object({
  threadId: z.string().min(1),
  direction: z.enum(supportMessageDirections),
  message: z.string().trim().min(1),
  senderName: z.string().trim().optional(),
  senderEmail: z.string().trim().email().optional().or(z.literal("")),
  senderPhone: z.string().trim().optional(),
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
  phone: z.string().trim().optional(),
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

const maxUploadSizeBytes = 8 * 1024 * 1024;

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

export async function updateOrderStatusAction(formData: FormData) {
  const payload = updateOrderStatusSchema.parse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });

  await updateAdminOrderStatus(payload.orderId, payload.status, payload.note ?? null);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function updateOrderNotesAction(formData: FormData) {
  const payload = updateOrderNotesSchema.parse({
    orderId: formData.get("orderId"),
    internalNotes: formData.get("internalNotes"),
  });

  await updateAdminOrderInternalNotes(payload.orderId, payload.internalNotes ?? "");
  revalidatePath("/admin/orders");
}

export async function updateRepairStatusAction(formData: FormData) {
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
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
}

export async function saveSiteSettingsAction(formData: FormData) {
  const keys = [
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
    "about.values",
    "seo.default_title",
    "seo.default_description",
    "seo.default_image",
    "commerce.delivery_fee_home",
    "home.trust_points",
    "home.service_highlights",
  ] as const;

  for (const key of keys) {
    const value = String(formData.get(key) ?? "");
    await updateAdminSiteSetting(key, value);
  }

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/service");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
}

export async function uploadRepairAttachmentAction(formData: FormData) {
  const payload = uploadRepairAttachmentSchema.parse({
    repairId: formData.get("repairId"),
    fileLabel: formData.get("fileLabel"),
  });

  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0 || file.size > maxUploadSizeBytes) {
    return;
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());
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
  const payload = uploadJournalCoverSchema.parse({
    journalId: formData.get("journalId"),
  });

  const file = formData.get("coverImage");
  if (!(file instanceof File) || file.size === 0 || file.size > maxUploadSizeBytes) {
    return;
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());
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
  const payload = uploadProductPrimaryImageSchema.parse({
    productId: formData.get("productId"),
    imageAlt: formData.get("imageAlt") || undefined,
  });

  const file = formData.get("primaryImageFile");
  if (!(file instanceof File) || file.size === 0 || file.size > maxUploadSizeBytes) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    return;
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());
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

export async function upsertCampaignAction(formData: FormData) {
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
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
}

export async function createSupportThreadAction(formData: FormData) {
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
  const payload = updateSupportThreadStatusSchema.parse({
    threadId: formData.get("threadId"),
    status: formData.get("status"),
  });

  await updateSupportThreadStatus(payload.threadId, payload.status);
  revalidatePath("/admin/support");
}

export async function upsertNotificationTemplateAction(formData: FormData) {
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
  revalidatePath("/admin/operations");
}

export async function upsertPurchaseOrderAction(formData: FormData) {
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
  revalidatePath("/admin/operations");
}

export async function createStockMovementAction(formData: FormData) {
  const payload = createStockMovementSchema.parse({
    productId: formData.get("productId") || undefined,
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
  });
  revalidatePath("/admin/operations");
  revalidatePath("/admin/products");
}

export async function upsertWorkOrderAction(formData: FormData) {
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
  revalidatePath("/admin/operations");
  revalidatePath("/admin/repairs");
}

export async function upsertLoyaltyRuleAction(formData: FormData) {
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
