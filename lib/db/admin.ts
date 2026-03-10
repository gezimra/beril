import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import {
  addFallbackRepairAttachment,
  addFallbackContact,
  getFallbackContacts,
  getFallbackCustomerKey,
  getFallbackJournalPosts,
  getFallbackOrders,
  getFallbackProducts,
  getFallbackRepairs,
  getFallbackSiteSettings,
  updateFallbackOrder,
  updateFallbackRepair,
  updateFallbackJournalCoverImage,
  updateFallbackSiteSetting,
  upsertFallbackJournalPost,
  upsertFallbackProduct,
} from "@/lib/db/fallback-store";
import { mockSiteSettings } from "@/lib/db/mock-data";
import type {
  AdminContact,
  AdminCustomerRow,
  AdminDashboardStats,
  AdminJournalPost,
  AdminOrder,
  AdminProductRow,
  AdminRepair,
} from "@/types/admin";
import type {
  JournalStatus,
  OrderStatus,
  RepairStatus,
  StockStatus,
} from "@/types/domain";
import type { Product } from "@/types/product";
import type { SiteSettings } from "@/types/site-settings";

interface ListFilterParams {
  search?: string;
  status?: string;
}

type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  email: string | null;
  country: string;
  city: string;
  address: string;
  notes: string | null;
  internal_notes: string | null;
  delivery_method: AdminOrder["deliveryMethod"];
  payment_method: AdminOrder["paymentMethod"];
  payment_status: AdminOrder["paymentStatus"];
  order_status: AdminOrder["orderStatus"];
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    product_id: string | null;
    product_title_snapshot: string;
    product_brand_snapshot: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  order_status_history?: Array<{
    status: AdminOrder["orderStatus"];
    note: string | null;
    created_at: string;
  }>;
};

type RepairRow = {
  id: string;
  repair_code: string;
  customer_name: string;
  email: string | null;
  phone: string;
  preferred_contact_method: AdminRepair["preferredContactMethod"];
  item_type: string;
  brand: string;
  model: string;
  service_type: string;
  description: string;
  status: AdminRepair["status"];
  estimated_completion: string | null;
  amount_due: number | null;
  notes_internal: string | null;
  notes_customer: string | null;
  created_at: string;
  updated_at: string;
  repair_status_history?: Array<{
    status: AdminRepair["status"];
    note: string | null;
    created_at: string;
    visible_to_customer: boolean;
  }>;
  repair_attachments?: Array<{
    id: string;
    file_url: string;
    file_type: string;
    file_label: string | null;
    created_at: string;
  }>;
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "completed",
  "cancelled",
];

const REPAIR_STATUSES: RepairStatus[] = [
  "request_received",
  "awaiting_drop_off",
  "received_in_store",
  "under_inspection",
  "waiting_parts",
  "in_repair",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

const JOURNAL_STATUSES: JournalStatus[] = ["draft", "published", "archived"];
const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

const nowIso = () => new Date().toISOString();

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");
}

function toAdminOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    orderCode: row.order_code,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    country: row.country,
    city: row.city,
    address: row.address,
    notes: row.notes,
    internalNotes: row.internal_notes,
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.order_items ?? []).map((item) => ({
      productId: item.product_id,
      title: item.product_title_snapshot,
      brand: item.product_brand_snapshot,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
    })),
    history: (row.order_status_history ?? []).map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.created_at,
    })),
  };
}

function toAdminRepair(row: RepairRow): AdminRepair {
  return {
    id: row.id,
    repairCode: row.repair_code,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    preferredContactMethod: row.preferred_contact_method,
    itemType: row.item_type,
    brand: row.brand,
    model: row.model,
    serviceType: row.service_type,
    description: row.description,
    status: row.status,
    estimatedCompletion: row.estimated_completion,
    amountDue: row.amount_due,
    notesInternal: row.notes_internal,
    notesCustomer: row.notes_customer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: (row.repair_status_history ?? []).map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.created_at,
      visibleToCustomer: event.visible_to_customer,
    })),
    attachments: (row.repair_attachments ?? []).map((attachment) => ({
      id: attachment.id,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      fileLabel: attachment.file_label,
      createdAt: attachment.created_at,
    })),
  };
}

function productToAdminRow(product: Product): AdminProductRow {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryImage = sortedImages[0];
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    category: product.category,
    price: product.price,
    stockStatus: product.stockStatus,
    quantity: product.quantity,
    featured: product.featured,
    isNew: product.isNew,
    primaryCtaMode: product.primaryCtaMode,
    primaryImageUrl: primaryImage?.url ?? null,
    primaryImageAlt: primaryImage?.alt ?? null,
    imageUrls: sortedImages.map((image) => image.url),
    specs: [...product.specs]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((spec) => ({ key: spec.key, value: spec.value })),
    status: product.status,
  };
}

function includesSearch(source: string, search?: string) {
  if (!search) {
    return true;
  }

  return source.toLowerCase().includes(search.toLowerCase());
}

export async function listAdminOrders({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminOrder[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return getFallbackOrders()
      .filter((order) =>
        status ? order.orderStatus === (status as OrderStatus) : true,
      )
      .filter((order) =>
        includesSearch(
          `${order.orderCode} ${order.customerName} ${order.phone} ${order.email ?? ""}`,
          search,
        ),
      );
  }

  let query = serviceClient
    .from("orders")
    .select(
      `
      id, order_code, customer_name, phone, email, country, city, address, notes, internal_notes,
      delivery_method, payment_method, payment_status, order_status, subtotal, delivery_fee, total,
      created_at, updated_at,
      order_items(product_id, product_title_snapshot, product_brand_snapshot, quantity, unit_price, total_price),
      order_status_history(status, note, created_at)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(150);

  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    query = query.eq("order_status", status);
  }

  if (search) {
    query = query.or(
      `order_code.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return getFallbackOrders();
  }

  return (data as OrderRow[]).map(toAdminOrder);
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  note: string | null,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const existing = updateFallbackOrder(orderId, { orderStatus: status });
    if (existing) {
      existing.history.unshift({
        status,
        note,
        createdAt: nowIso(),
      });
    }
    return;
  }

  const { error: updateError } = await serviceClient
    .from("orders")
    .update({ order_status: status })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: historyError } = await serviceClient
    .from("order_status_history")
    .insert({ order_id: orderId, status, note });

  if (historyError) {
    throw new Error(historyError.message);
  }
}

export async function updateAdminOrderInternalNotes(orderId: string, notes: string) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    updateFallbackOrder(orderId, { internalNotes: notes || null });
    return;
  }

  const { error } = await serviceClient
    .from("orders")
    .update({ internal_notes: notes || null })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminRepairs({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminRepair[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return getFallbackRepairs()
      .filter((repair) =>
        status ? repair.status === (status as RepairStatus) : true,
      )
      .filter((repair) =>
        includesSearch(
          `${repair.repairCode} ${repair.customerName} ${repair.phone} ${repair.brand} ${repair.model}`,
          search,
        ),
      );
  }

  let query = serviceClient
    .from("repair_requests")
    .select(
      `
      id, repair_code, customer_name, email, phone, preferred_contact_method, item_type, brand, model, service_type,
      description, status, estimated_completion, amount_due, notes_internal, notes_customer, created_at, updated_at,
      repair_status_history(status, note, created_at, visible_to_customer),
      repair_attachments(id, file_url, file_type, file_label, created_at)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && REPAIR_STATUSES.includes(status as RepairStatus)) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `repair_code.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return getFallbackRepairs();
  }

  return (data as RepairRow[]).map(toAdminRepair);
}

export async function updateAdminRepairStatus(
  repairId: string,
  status: RepairStatus,
  note: string | null,
  visibleToCustomer: boolean,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const existing = updateFallbackRepair(repairId, { status });
    if (existing) {
      existing.history.unshift({
        status,
        note,
        createdAt: nowIso(),
        visibleToCustomer,
      });
    }
    return;
  }

  const { error: updateError } = await serviceClient
    .from("repair_requests")
    .update({ status })
    .eq("id", repairId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: historyError } = await serviceClient
    .from("repair_status_history")
    .insert({
      repair_request_id: repairId,
      status,
      note,
      visible_to_customer: visibleToCustomer,
    });

  if (historyError) {
    throw new Error(historyError.message);
  }
}

export async function updateAdminRepairNotes(
  repairId: string,
  internalNotes: string,
  customerNotes: string,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    updateFallbackRepair(repairId, {
      notesInternal: internalNotes || null,
      notesCustomer: customerNotes || null,
    });
    return;
  }

  const { error } = await serviceClient
    .from("repair_requests")
    .update({
      notes_internal: internalNotes || null,
      notes_customer: customerNotes || null,
    })
    .eq("id", repairId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAdminRepairEstimate(
  repairId: string,
  estimatedCompletion: string,
  amountDue: number | null,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    updateFallbackRepair(repairId, {
      estimatedCompletion: estimatedCompletion || null,
      amountDue,
    });
    return;
  }

  const { error } = await serviceClient
    .from("repair_requests")
    .update({
      estimated_completion: estimatedCompletion || null,
      amount_due: amountDue,
    })
    .eq("id", repairId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function addAdminRepairAttachment(input: {
  repairId: string;
  fileName: string;
  fileType: string;
  fileBytes: Uint8Array;
  fileLabel?: string | null;
}) {
  const safeName = sanitizeFileName(input.fileName);
  const fileType = input.fileType || "application/octet-stream";

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    addFallbackRepairAttachment({
      repairId: input.repairId,
      fileUrl: `/uploads/repairs/${input.repairId}/${safeName}`,
      fileType,
      fileLabel: input.fileLabel ?? null,
    });
    return;
  }

  const path = `${input.repairId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await serviceClient.storage
    .from("repairs")
    .upload(path, input.fileBytes, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = serviceClient.storage.from("repairs").getPublicUrl(path);
  const { error: insertError } = await serviceClient
    .from("repair_attachments")
    .insert({
      repair_request_id: input.repairId,
      file_url: data.publicUrl,
      file_type: fileType,
      file_label: input.fileLabel ?? null,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function listAdminProducts({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminProductRow[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return getFallbackProducts()
      .filter((product) =>
        status ? product.status === (status as (typeof PRODUCT_STATUSES)[number]) : true,
      )
      .filter((product) =>
        includesSearch(`${product.title} ${product.brand} ${product.slug}`, search),
      )
      .map(productToAdminRow);
  }

  let query = serviceClient
    .from("products")
    .select(
      `
      id, slug, title, brand, category, price, stock_status, quantity, featured, is_new, primary_cta_mode, status,
      product_images(url, alt, sort_order),
      product_specs(key, value, sort_order)
      `,
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (status && PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return getFallbackProducts().map(productToAdminRow);
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    brand: String(row.brand),
    category: row.category as AdminProductRow["category"],
    price: Number(row.price),
    stockStatus: row.stock_status as StockStatus,
    quantity: (row.quantity as number | null) ?? null,
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    primaryCtaMode: row.primary_cta_mode as AdminProductRow["primaryCtaMode"],
    primaryImageUrl: (
      ((row.product_images as Array<Record<string, unknown>> | undefined) ?? [])
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((image) => String(image.url))[0] ?? null
    ),
    primaryImageAlt: (
      ((row.product_images as Array<Record<string, unknown>> | undefined) ?? [])
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((image) => String(image.alt))[0] ?? null
    ),
    imageUrls: ((row.product_images as Array<Record<string, unknown>> | undefined) ?? [])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((image) => String(image.url)),
    specs: ((row.product_specs as Array<Record<string, unknown>> | undefined) ?? [])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((spec) => ({
        key: String(spec.key),
        value: String(spec.value),
      })),
    status: row.status as AdminProductRow["status"],
  }));
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function upsertAdminProduct(input: {
  id?: string;
  title: string;
  brand: string;
  category: "watch" | "eyewear";
  price: number;
  stockStatus: StockStatus;
  quantity: number | null;
  featured: boolean;
  isNew: boolean;
  primaryCtaMode: "add_to_cart" | "reserve_in_store" | "whatsapp_inquiry" | "request_availability";
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
  imageUrls?: string[];
  specs?: Array<{ key: string; value: string }>;
  status: "draft" | "active" | "archived";
}) {
  const serviceClient = createSupabaseServiceClient();
  const slugBase = slugify(`${input.brand}-${input.title}`);
  const slug = input.id ? undefined : `${slugBase}-${Date.now().toString().slice(-4)}`;

  if (!serviceClient) {
    if (input.id) {
      const existing = getFallbackProducts().find((product) => product.id === input.id);
      if (!existing) {
        throw new Error("Product not found.");
      }

      upsertFallbackProduct({
        ...existing,
        title: input.title,
        brand: input.brand,
        category: input.category,
        price: input.price,
        stockStatus: input.stockStatus,
        quantity: input.quantity,
        featured: input.featured,
        isNew: input.isNew,
        primaryCtaMode: input.primaryCtaMode,
        status: input.status,
        updatedAt: nowIso(),
        images:
          input.imageUrls && input.imageUrls.length > 0
            ? input.imageUrls.map((url, index) => ({
                id: `${existing.id}-img-${index + 1}`,
                productId: existing.id,
                url,
                alt:
                  index === 0
                    ? input.primaryImageAlt ?? `${input.title} product image`
                    : `${input.title} product image ${index + 1}`,
                sortOrder: index + 1,
              }))
            : input.primaryImageUrl
              ? [
                  {
                    ...(existing.images[0] ?? {
                      id: `img-${Date.now()}`,
                      productId: existing.id,
                      sortOrder: 1,
                    }),
                    url: input.primaryImageUrl,
                    alt: input.primaryImageAlt ?? `${input.title} product image`,
                  },
                  ...existing.images.slice(1),
                ]
              : existing.images,
        specs:
          input.specs && input.specs.length > 0
            ? input.specs.map((spec, index) => ({
                id: `${existing.id}-spec-${index + 1}`,
                productId: existing.id,
                key: spec.key,
                value: spec.value,
                sortOrder: index + 1,
              }))
            : existing.specs,
      });
      return;
    }

    const newProductId = `p-${Date.now()}`;
    const newProduct: Product = {
      id: newProductId,
      slug: slug ?? `${slugBase}-new`,
      title: input.title,
      brand: input.brand,
      category: input.category,
      subtype: input.category === "watch" ? "analog_watch" : "frame",
      shortDescription: "New product draft",
      description: "Product details pending update.",
      price: input.price,
      currency: "EUR",
      stockStatus: input.stockStatus,
      quantity: input.quantity,
      featured: input.featured,
      isNew: input.isNew,
      status: input.status,
      primaryCtaMode: input.primaryCtaMode,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      images: [
        {
          id: `img-${Date.now()}`,
          productId: newProductId,
          url: "/placeholders/product-default.svg",
          alt: `${input.title} product image`,
          sortOrder: 1,
        },
      ],
      specs:
        input.specs?.map((spec, index) => ({
          id: `${newProductId}-spec-${index + 1}`,
          productId: newProductId,
          key: spec.key,
          value: spec.value,
          sortOrder: index + 1,
        })) ?? [],
    };
    if (input.primaryImageUrl) {
      newProduct.images[0] = {
        ...newProduct.images[0],
        url: input.primaryImageUrl,
        alt: input.primaryImageAlt ?? `${input.title} product image`,
      };
    }
    if (input.imageUrls && input.imageUrls.length > 0) {
      newProduct.images = input.imageUrls.map((url, index) => ({
        id: `${newProductId}-img-${index + 1}`,
        productId: newProductId,
        url,
        alt:
          index === 0
            ? input.primaryImageAlt ?? `${input.title} product image`
            : `${input.title} product image ${index + 1}`,
        sortOrder: index + 1,
      }));
    }
    upsertFallbackProduct(newProduct);
    return;
  }

  if (input.id) {
    const { error } = await serviceClient
      .from("products")
      .update({
        title: input.title,
        brand: input.brand,
        category: input.category,
        price: input.price,
        stock_status: input.stockStatus,
        quantity: input.quantity,
        featured: input.featured,
        is_new: input.isNew,
        primary_cta_mode: input.primaryCtaMode,
        status: input.status,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    if (input.imageUrls) {
      const { error: deleteImagesError } = await serviceClient
        .from("product_images")
        .delete()
        .eq("product_id", input.id);

      if (deleteImagesError) {
        throw new Error(deleteImagesError.message);
      }

      if (input.imageUrls.length > 0) {
        const { error: insertImagesError } = await serviceClient.from("product_images").insert(
          input.imageUrls.map((url, index) => ({
            product_id: input.id,
            url,
            alt:
              index === 0
                ? input.primaryImageAlt ?? `${input.title} product image`
                : `${input.title} product image ${index + 1}`,
            sort_order: index + 1,
          })),
        );

        if (insertImagesError) {
          throw new Error(insertImagesError.message);
        }
      }
    } else if (input.primaryImageUrl) {
      const { error: imageError } = await serviceClient.from("product_images").upsert(
        {
          product_id: input.id,
          url: input.primaryImageUrl,
          alt: input.primaryImageAlt ?? `${input.title} product image`,
          sort_order: 1,
        },
        { onConflict: "product_id,sort_order" },
      );

      if (imageError) {
        throw new Error(imageError.message);
      }
    }

    if (input.specs) {
      const { error: deleteSpecsError } = await serviceClient
        .from("product_specs")
        .delete()
        .eq("product_id", input.id);

      if (deleteSpecsError) {
        throw new Error(deleteSpecsError.message);
      }

      if (input.specs.length > 0) {
        const { error: insertSpecsError } = await serviceClient.from("product_specs").insert(
          input.specs.map((spec, index) => ({
            product_id: input.id,
            key: spec.key,
            value: spec.value,
            sort_order: index + 1,
          })),
        );

        if (insertSpecsError) {
          throw new Error(insertSpecsError.message);
        }
      }
    }

    return;
  }

  const { data: createdProduct, error } = await serviceClient
    .from("products")
    .insert({
      slug,
      title: input.title,
      brand: input.brand,
      category: input.category,
      subtype: input.category === "watch" ? "analog_watch" : "frame",
      short_description: "New product draft",
      description: "Product details pending update.",
      price: input.price,
      currency: "EUR",
      stock_status: input.stockStatus,
      quantity: input.quantity,
      featured: input.featured,
      is_new: input.isNew,
      status: input.status,
      primary_cta_mode: input.primaryCtaMode,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (input.imageUrls && input.imageUrls.length > 0) {
    const { error: insertImagesError } = await serviceClient.from("product_images").insert(
      input.imageUrls.map((url, index) => ({
        product_id: createdProduct.id,
        url,
        alt:
          index === 0
            ? input.primaryImageAlt ?? `${input.title} product image`
            : `${input.title} product image ${index + 1}`,
        sort_order: index + 1,
      })),
    );

    if (insertImagesError) {
      throw new Error(insertImagesError.message);
    }
  } else if (input.primaryImageUrl) {
    const { error: imageError } = await serviceClient.from("product_images").upsert(
      {
        product_id: createdProduct.id,
        url: input.primaryImageUrl,
        alt: input.primaryImageAlt ?? `${input.title} product image`,
        sort_order: 1,
      },
      { onConflict: "product_id,sort_order" },
    );

    if (imageError) {
      throw new Error(imageError.message);
    }
  }

  if (input.specs && input.specs.length > 0) {
    const { error: insertSpecsError } = await serviceClient.from("product_specs").insert(
      input.specs.map((spec, index) => ({
        product_id: createdProduct.id,
        key: spec.key,
        value: spec.value,
        sort_order: index + 1,
      })),
    );

    if (insertSpecsError) {
      throw new Error(insertSpecsError.message);
    }
  }
}

export async function uploadAdminProductPrimaryImage(input: {
  productId: string;
  imageAlt?: string | null;
  fileName: string;
  fileType: string;
  fileBytes: Uint8Array;
}) {
  const safeName = sanitizeFileName(input.fileName);
  const fileType = input.fileType || "image/jpeg";
  const serviceClient = createSupabaseServiceClient();

  if (!fileType.startsWith("image/")) {
    throw new Error("Only image files are allowed for product uploads.");
  }

  if (!serviceClient) {
    const existing = getFallbackProducts().find((product) => product.id === input.productId);
    if (!existing) {
      throw new Error("Product not found.");
    }

    const primaryImage = existing.images.find((image) => image.sortOrder === 1);
    const nextPrimary = {
      ...(primaryImage ?? {
        id: `${existing.id}-img-${Date.now()}`,
        productId: existing.id,
        sortOrder: 1,
      }),
      url: `/uploads/products/${existing.id}/${safeName}`,
      alt:
        input.imageAlt?.trim() ||
        primaryImage?.alt ||
        `${existing.title} product image`,
    };

    upsertFallbackProduct({
      ...existing,
      updatedAt: nowIso(),
      images: [nextPrimary, ...existing.images.filter((image) => image.sortOrder !== 1)],
    });
    return;
  }

  const path = `${input.productId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await serviceClient.storage
    .from("products")
    .upload(path, input.fileBytes, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = serviceClient.storage.from("products").getPublicUrl(path);

  const { data: existingProduct, error: productError } = await serviceClient
    .from("products")
    .select("title")
    .eq("id", input.productId)
    .single();

  if (productError || !existingProduct) {
    await serviceClient.storage.from("products").remove([path]);
    throw new Error(productError?.message ?? "Product not found.");
  }

  const { error: imageError } = await serviceClient.from("product_images").upsert(
    {
      product_id: input.productId,
      url: data.publicUrl,
      alt:
        input.imageAlt?.trim() ||
        `${String(existingProduct.title)} product image`,
      sort_order: 1,
    },
    { onConflict: "product_id,sort_order" },
  );

  if (imageError) {
    await serviceClient.storage.from("products").remove([path]);
    throw new Error(imageError.message);
  }
}

export async function listAdminContacts({
  search,
}: Pick<ListFilterParams, "search"> = {}): Promise<AdminContact[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return getFallbackContacts().filter((contact) =>
      includesSearch(
        `${contact.name} ${contact.email} ${contact.phone} ${contact.subject}`,
        search,
      ),
    );
  }

  let query = serviceClient
    .from("contacts")
    .select("id, name, email, phone, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,subject.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return getFallbackContacts();
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    subject: String(row.subject),
    message: String(row.message),
    createdAt: String(row.created_at),
  }));
}

export async function createContactInquiry(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const serviceClient = createSupabaseServiceClient();
  const createdAt = nowIso();

  if (!serviceClient) {
    addFallbackContact({
      id: `contact-${Date.now()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      createdAt,
    });
    return;
  }

  const { error } = await serviceClient.from("contacts").insert({
    name: input.name,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    message: input.message,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminJournalPosts({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminJournalPost[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return getFallbackJournalPosts()
      .filter((post) => (status ? post.status === status : true))
      .filter((post) => includesSearch(`${post.title} ${post.slug}`, search));
  }

  let query = serviceClient
    .from("journal_posts")
    .select(
      "id, slug, title, excerpt, content, cover_image, status, published_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (status && JOURNAL_STATUSES.includes(status as JournalStatus)) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return getFallbackJournalPosts();
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt),
    content: String(row.content),
    coverImage: (row.cover_image as string | null) ?? null,
    status: row.status as JournalStatus,
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function upsertAdminJournalPost(input: {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: JournalStatus;
}) {
  const publishedAt = input.status === "published" ? nowIso() : null;
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    const existing = input.id
      ? getFallbackJournalPosts().find((post) => post.id === input.id)
      : undefined;
    upsertFallbackJournalPost({
      id: input.id ?? `journal-${Date.now()}`,
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: existing?.coverImage ?? "/placeholders/product-default.svg",
      status: input.status,
      publishedAt,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  if (input.id) {
    const { error } = await serviceClient
      .from("journal_posts")
      .update({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        status: input.status,
        published_at: publishedAt,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await serviceClient.from("journal_posts").insert({
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    status: input.status,
    published_at: publishedAt,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadAdminJournalCoverImage(input: {
  journalId: string;
  fileName: string;
  fileType: string;
  fileBytes: Uint8Array;
}) {
  const safeName = sanitizeFileName(input.fileName);
  const fileType = input.fileType || "image/jpeg";
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    updateFallbackJournalCoverImage(
      input.journalId,
      `/uploads/journal/${input.journalId}/${safeName}`,
    );
    return;
  }

  const path = `${input.journalId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await serviceClient.storage
    .from("journal")
    .upload(path, input.fileBytes, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = serviceClient.storage.from("journal").getPublicUrl(path);
  const { error } = await serviceClient
    .from("journal_posts")
    .update({ cover_image: data.publicUrl })
    .eq("id", input.journalId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listPublishedJournalPosts() {
  return (await listAdminJournalPosts({ status: "published" })).sort((a, b) =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
  );
}

export async function getPublishedJournalPostBySlug(slug: string) {
  const posts = await listPublishedJournalPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getAdminSiteSettingEntries() {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return Array.from(getFallbackSiteSettings().entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  const { data, error } = await serviceClient
    .from("site_settings")
    .select("key, value")
    .limit(300);

  if (error || !data) {
    return Array.from(getFallbackSiteSettings().entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  return (data as Array<Record<string, unknown>>).map((row) => ({
    key: String(row.key),
    value: String(row.value),
  }));
}

function parseListValue(value: string, fallback: string[]) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")) {
      return parsed;
    }
  } catch {
    // ignore parse issues
  }
  return fallback;
}

export async function getExtendedSiteSettings(): Promise<
  SiteSettings & {
    aboutIntro: string;
    aboutStory: string;
    aboutValues: string[];
  }
> {
  const entries = await getAdminSiteSettingEntries();
  const byKey = new Map(entries.map((entry) => [entry.key, entry.value]));

  return {
    businessName: byKey.get("business.name") ?? mockSiteSettings.businessName,
    heroHeadline: byKey.get("hero.headline") ?? mockSiteSettings.heroHeadline,
    heroSubheadline:
      byKey.get("hero.subheadline") ?? mockSiteSettings.heroSubheadline,
    heroPrimaryCtaLabel:
      byKey.get("hero.primary_cta_label") ?? mockSiteSettings.heroPrimaryCtaLabel,
    heroPrimaryCtaHref:
      byKey.get("hero.primary_cta_href") ?? mockSiteSettings.heroPrimaryCtaHref,
    heroSecondaryCtaLabel:
      byKey.get("hero.secondary_cta_label") ??
      mockSiteSettings.heroSecondaryCtaLabel,
    heroSecondaryCtaHref:
      byKey.get("hero.secondary_cta_href") ?? mockSiteSettings.heroSecondaryCtaHref,
    trustPoints: parseListValue(
      byKey.get("home.trust_points") ?? "",
      mockSiteSettings.trustPoints,
    ),
    serviceHighlights: parseListValue(
      byKey.get("home.service_highlights") ?? "",
      mockSiteSettings.serviceHighlights,
    ),
    storeAddress: byKey.get("store.address") ?? mockSiteSettings.storeAddress,
    storeHours: byKey.get("store.hours") ?? mockSiteSettings.storeHours,
    storePhone: byKey.get("store.phone") ?? mockSiteSettings.storePhone,
    storeEmail: byKey.get("store.email") ?? mockSiteSettings.storeEmail,
    storeWhatsapp: byKey.get("store.whatsapp") ?? mockSiteSettings.storeWhatsapp,
    mapUrl: byKey.get("store.map_url") ?? mockSiteSettings.mapUrl,
    homeDeliveryFee:
      byKey.get("commerce.delivery_fee_home") ?? mockSiteSettings.homeDeliveryFee,
    defaultSeoTitle:
      byKey.get("seo.default_title") ?? mockSiteSettings.defaultSeoTitle,
    defaultSeoDescription:
      byKey.get("seo.default_description") ?? mockSiteSettings.defaultSeoDescription,
    defaultSeoImage:
      byKey.get("seo.default_image") ?? mockSiteSettings.defaultSeoImage,
    aboutIntro:
      byKey.get("about.intro") ??
      "BERIL is a local boutique for watches, eyewear, and trusted service.",
    aboutStory:
      byKey.get("about.story") ??
      "We combine curated selection and practical service care in Gjilan.",
    aboutValues: parseListValue(
      byKey.get("about.values") ?? "",
      ["Precision", "Trust", "Craft", "Calm service"],
    ),
  };
}

export async function updateAdminSiteSetting(key: string, value: string) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    updateFallbackSiteSetting(key, value);
    return;
  }

  const { error } = await serviceClient
    .from("site_settings")
    .upsert(
      {
        key,
        value,
      },
      { onConflict: "key" },
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminCustomers({
  search,
}: Pick<ListFilterParams, "search"> = {}): Promise<AdminCustomerRow[]> {
  const [orders, repairs, contacts] = await Promise.all([
    listAdminOrders(),
    listAdminRepairs(),
    listAdminContacts(),
  ]);

  type CustomerAccumulator = AdminCustomerRow & {
    latestOrderAt: string | null;
    latestRepairAt: string | null;
    latestContactAt: string | null;
  };

  const customers = new Map<string, CustomerAccumulator>();

  function ensureCustomer(
    key: string,
    seed: { name?: string; email?: string | null; phone?: string | null; timestamp: string },
  ) {
    const existing = customers.get(key);
    if (existing) {
      existing.name = seed.name ?? existing.name;
      existing.email = seed.email ?? existing.email;
      existing.phone = seed.phone ?? existing.phone;
      if (seed.timestamp > existing.lastActivityAt) {
        existing.lastActivityAt = seed.timestamp;
      }
      return existing;
    }

    const created: CustomerAccumulator = {
      key,
      name: seed.name ?? "Unknown",
      email: seed.email ?? null,
      phone: seed.phone ?? null,
      orderCount: 0,
      repairCount: 0,
      contactCount: 0,
      latestOrderCode: null,
      latestRepairCode: null,
      latestContactSubject: null,
      lastActivityAt: seed.timestamp,
      latestOrderAt: null,
      latestRepairAt: null,
      latestContactAt: null,
    };
    customers.set(key, created);
    return created;
  }

  for (const order of orders) {
    const key = getFallbackCustomerKey(order.email, order.phone);
    const customer = ensureCustomer(key, {
      name: order.customerName,
      email: order.email,
      phone: order.phone,
      timestamp: order.createdAt,
    });
    customer.orderCount += 1;
    if (!customer.latestOrderAt || order.createdAt > customer.latestOrderAt) {
      customer.latestOrderAt = order.createdAt;
      customer.latestOrderCode = order.orderCode;
    }
  }

  for (const repair of repairs) {
    const key = getFallbackCustomerKey(repair.email, repair.phone);
    const customer = ensureCustomer(key, {
      name: repair.customerName,
      email: repair.email,
      phone: repair.phone,
      timestamp: repair.createdAt,
    });
    customer.repairCount += 1;
    if (!customer.latestRepairAt || repair.createdAt > customer.latestRepairAt) {
      customer.latestRepairAt = repair.createdAt;
      customer.latestRepairCode = repair.repairCode;
    }
  }

  for (const contact of contacts) {
    const key = getFallbackCustomerKey(contact.email, contact.phone);
    const customer = ensureCustomer(key, {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      timestamp: contact.createdAt,
    });
    customer.contactCount += 1;
    if (!customer.latestContactAt || contact.createdAt > customer.latestContactAt) {
      customer.latestContactAt = contact.createdAt;
      customer.latestContactSubject = contact.subject;
    }
  }

  return Array.from(customers.values())
    .filter((entry) =>
      includesSearch(`${entry.name} ${entry.email ?? ""} ${entry.phone ?? ""}`, search),
    )
    .map((entry) => ({
      key: entry.key,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      orderCount: entry.orderCount,
      repairCount: entry.repairCount,
      contactCount: entry.contactCount,
      latestOrderCode: entry.latestOrderCode,
      latestRepairCode: entry.latestRepairCode,
      latestContactSubject: entry.latestContactSubject,
      lastActivityAt: entry.lastActivityAt,
    }))
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [orders, repairs, products, contacts] = await Promise.all([
    listAdminOrders(),
    listAdminRepairs(),
    listAdminProducts(),
    listAdminContacts(),
  ]);

  return {
    pendingOrders: orders.filter((order) => order.orderStatus === "pending").length,
    newRepairs: repairs.filter((repair) =>
      ["request_received", "awaiting_drop_off"].includes(repair.status),
    ).length,
    lowStockProducts: products.filter(
      (product) =>
        product.stockStatus === "limited" ||
        product.quantity !== null && product.quantity <= 2,
    ).length,
    contactInquiries: contacts.length,
  };
}

export async function getRecentDashboardData() {
  const [orders, repairs, contacts] = await Promise.all([
    listAdminOrders(),
    listAdminRepairs(),
    listAdminContacts(),
  ]);

  return {
    recentOrders: orders.slice(0, 5),
    recentRepairs: repairs.slice(0, 5),
    recentContacts: contacts.slice(0, 5),
  };
}
