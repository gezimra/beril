import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import {
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
  updateFallbackSiteSetting,
  upsertFallbackJournalPost,
  upsertFallbackProduct,
} from "@/lib/db/fallback-store";
import { mockSiteSettings } from "@/lib/db/mock-data";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";
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
const STOCK_STATUSES: StockStatus[] = [
  "in_stock",
  "limited",
  "available_on_request",
  "out_of_stock",
];

const nowIso = () => new Date().toISOString();

function toAdminOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    orderCode: row.order_code,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
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
  };
}

function productToAdminRow(product: Product): AdminProductRow {
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
      id, order_code, customer_name, phone, email, city, address, notes, internal_notes,
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
      repair_status_history(status, note, created_at, visible_to_customer)
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
      "id, slug, title, brand, category, price, stock_status, quantity, featured, is_new, status",
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
        status: input.status,
        updatedAt: nowIso(),
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
      primaryCtaMode: "add_to_cart",
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
      specs: [],
    };
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
        status: input.status,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await serviceClient.from("products").insert({
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
    primary_cta_mode: "add_to_cart",
  });

  if (error) {
    throw new Error(error.message);
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
    storeWhatsapp: byKey.get("store.whatsapp") ?? mockSiteSettings.storeWhatsapp,
    mapUrl: byKey.get("store.map_url") ?? mockSiteSettings.mapUrl,
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

  const { error } = await serviceClient.from("site_settings").upsert({
    key,
    value,
  });

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

  const customers = new Map<string, AdminCustomerRow>();

  const touchCustomer = (
    key: string,
    data: Partial<AdminCustomerRow> & { timestamp: string },
  ) => {
    const existing = customers.get(key);
    if (!existing) {
      customers.set(key, {
        key,
        name: data.name ?? "Unknown",
        email: data.email ?? null,
        phone: data.phone ?? null,
        orderCount: data.orderCount ?? 0,
        repairCount: data.repairCount ?? 0,
        contactCount: data.contactCount ?? 0,
        lastActivityAt: data.timestamp,
      });
      return;
    }

    existing.name = data.name ?? existing.name;
    existing.email = data.email ?? existing.email;
    existing.phone = data.phone ?? existing.phone;
    existing.orderCount += data.orderCount ?? 0;
    existing.repairCount += data.repairCount ?? 0;
    existing.contactCount += data.contactCount ?? 0;
    if (data.timestamp > existing.lastActivityAt) {
      existing.lastActivityAt = data.timestamp;
    }
  };

  for (const order of orders) {
    const key = getFallbackCustomerKey(order.email, order.phone);
    touchCustomer(key, {
      name: order.customerName,
      email: order.email,
      phone: order.phone,
      orderCount: 1,
      timestamp: order.createdAt,
    });
  }

  for (const repair of repairs) {
    const key = getFallbackCustomerKey(repair.email, repair.phone);
    touchCustomer(key, {
      name: repair.customerName,
      email: repair.email,
      phone: repair.phone,
      repairCount: 1,
      timestamp: repair.createdAt,
    });
  }

  for (const contact of contacts) {
    const key = getFallbackCustomerKey(contact.email, contact.phone);
    touchCustomer(key, {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      contactCount: 1,
      timestamp: contact.createdAt,
    });
  }

  return Array.from(customers.values())
    .filter((entry) =>
      includesSearch(`${entry.name} ${entry.email ?? ""} ${entry.phone ?? ""}`, search),
    )
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
