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
import { journalStatuses, orderStatuses, repairStatuses, stockStatuses } from "@/types/domain";

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
