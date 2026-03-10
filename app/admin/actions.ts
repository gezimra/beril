"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  updateAdminOrderInternalNotes,
  updateAdminOrderStatus,
  updateAdminRepairEstimate,
  updateAdminRepairNotes,
  updateAdminRepairStatus,
  updateAdminSiteSetting,
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
    status: payload.status,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/watches");
  revalidatePath("/eyewear");
}

export async function saveSiteSettingsAction(formData: FormData) {
  const keys = [
    "hero.headline",
    "hero.subheadline",
    "hero.primary_cta_label",
    "hero.primary_cta_href",
    "hero.secondary_cta_label",
    "hero.secondary_cta_href",
    "store.address",
    "store.hours",
    "store.phone",
    "store.whatsapp",
    "store.map_url",
    "about.intro",
    "about.story",
    "about.values",
    "commerce.delivery_fee_home",
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
