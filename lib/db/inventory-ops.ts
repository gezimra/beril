import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { syncOrderCashbookByOrderId } from "@/lib/db/order-cashbook-sync";
import {
  addFallbackOrder,
  addFallbackRepair,
  getFallbackProducts,
} from "@/lib/db/fallback-store";
import {
  generateOrderCode,
  generateRepairCode,
  normalizeEmail,
  normalizePhone,
} from "@/lib/utils/codes";
import type {
  AdminCashbookEntry,
  AdminInventoryCompatibility,
  AdminInventoryItem,
  AdminPurchaseOrder,
  AdminRepairPartUsage,
  AdminStockMovement,
  AdminSupplier,
  AdminTechnicianAssignment,
  AdminWatchBrand,
  AdminWatchCaliber,
  AdminWatchModel,
  AdminWatchReference,
  AdminWorkOrder,
} from "@/types/admin";
import type {
  CashEntryType,
  DeliveryMethod,
  InventoryItemType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PreferredContactMethod,
  PurchaseOrderStatus,
  RepairStatus,
  StockMovementType,
  TechnicianRole,
  WorkOrderStatus,
} from "@/types/domain";

interface ListFilterParams {
  search?: string;
  status?: string;
}

interface UpsertSupplierInput {
  id?: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

interface UpsertPurchaseOrderInput {
  id?: string;
  poNumber: string;
  supplierId?: string | null;
  status: PurchaseOrderStatus;
  orderedAt?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  subtotal?: number;
  total?: number;
}

interface CreateStockMovementInput {
  productId?: string | null;
  inventoryItemId?: string | null;
  movementType: StockMovementType;
  quantityDelta: number;
  unitCost?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
}

interface UpsertInventoryItemInput {
  id?: string;
  sku: string;
  name: string;
  itemType: InventoryItemType;
  brand?: string | null;
  model?: string | null;
  caliber?: string | null;
  quantityOnHand?: number;
  reorderLevel?: number;
  unitCost?: number | null;
  unitPrice?: number | null;
  location?: string | null;
  notes?: string | null;
  active?: boolean;
}

interface CreateCashbookEntryInput {
  entryDate?: string | null;
  entryType: CashEntryType;
  amount: number;
  category?: string | null;
  paymentMethod?: PaymentMethod;
  note?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

interface CreateManualOrderInput {
  customerName: string;
  phone: string;
  email?: string | null;
  country?: string | null;
  city: string;
  address: string;
  items: Array<{
    productId: string;
    quantity?: number;
    sellingPrice?: number;
    rabat?: number;
    rabatType?: "amount" | "percent";
  }>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  notes?: string | null;
  internalNotes?: string | null;
}

interface CreateManualRepairRequestInput {
  customerName: string;
  phone: string;
  email?: string | null;
  preferredContactMethod: PreferredContactMethod;
  itemType: "watch" | "eyewear" | "other";
  brand: string;
  model: string;
  serviceType: string;
  description: string;
  dropOffMethod: "bring_to_store" | "already_dropped_off" | "contact_me_first";
  status?: RepairStatus;
  estimatedCompletion?: string | null;
  amountDue?: number | null;
  notesInternal?: string | null;
  notesCustomer?: string | null;
}

interface UpsertWatchBrandInput {
  id?: string;
  name: string;
  country?: string | null;
  website?: string | null;
  notes?: string | null;
}

interface UpsertWatchCaliberInput {
  id?: string;
  brandId?: string | null;
  caliberName: string;
  movementType: string;
  powerReserveHours?: number | null;
  frequencyBph?: number | null;
  jewels?: number | null;
  diameterMm?: number | null;
  heightMm?: number | null;
  hasHacking?: boolean;
  hasHandWinding?: boolean;
  notes?: string | null;
}

interface UpsertWatchModelInput {
  id?: string;
  brandId?: string | null;
  modelName: string;
  collection?: string | null;
  targetGender?: string | null;
  notes?: string | null;
}

interface UpsertWatchReferenceInput {
  id?: string;
  modelId: string;
  referenceCode: string;
  caliberId?: string | null;
  caseSizeMm?: number | null;
  lugWidthMm?: number | null;
  waterResistanceM?: number | null;
  crystal?: string | null;
  caseMaterial?: string | null;
  dialColor?: string | null;
  strapType?: string | null;
  productionFromYear?: number | null;
  productionToYear?: number | null;
  notes?: string | null;
}

interface UpsertInventoryCompatibilityInput {
  id?: string;
  inventoryItemId: string;
  caliberId?: string | null;
  modelId?: string | null;
  referenceId?: string | null;
  notes?: string | null;
}

interface CreateRepairPartUsageInput {
  workOrderId: string;
  inventoryItemId: string;
  quantity: number;
  unitCost?: number | null;
  note?: string | null;
}

interface UpsertWorkOrderInput {
  id?: string;
  repairRequestId: string;
  status: WorkOrderStatus;
  diagnosis?: string | null;
  estimateAmount?: number | null;
  approvedByCustomer?: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface AssignTechnicianInput {
  workOrderId: string;
  profileId?: string | null;
  role: TechnicianRole;
}

const nowIso = () => new Date().toISOString();

const fallbackSuppliers: AdminSupplier[] = [];
const fallbackPurchaseOrders: AdminPurchaseOrder[] = [];
const fallbackStockMovements: AdminStockMovement[] = [];
const fallbackWorkOrders: AdminWorkOrder[] = [];
const fallbackAssignments: AdminTechnicianAssignment[] = [];
const fallbackInventoryItems: AdminInventoryItem[] = [];
const fallbackCashbookEntries: AdminCashbookEntry[] = [];
const fallbackWatchBrands: AdminWatchBrand[] = [];
const fallbackWatchCalibers: AdminWatchCaliber[] = [];
const fallbackWatchModels: AdminWatchModel[] = [];
const fallbackWatchReferences: AdminWatchReference[] = [];
const fallbackInventoryCompatibility: AdminInventoryCompatibility[] = [];
const fallbackRepairPartUsage: AdminRepairPartUsage[] = [];

function includesSearch(source: string, search?: string) {
  if (!search) {
    return true;
  }

  return source.toLowerCase().includes(search.toLowerCase());
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

export async function listAdminSuppliers({
  search,
}: ListFilterParams = {}): Promise<AdminSupplier[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackSuppliers.filter((supplier) =>
      includesSearch(`${supplier.name} ${supplier.email ?? ""}`, search),
    );
  }

  let query = serviceClient
    .from("suppliers")
    .select("id, name, contact_name, email, phone, notes, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(120);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    contactName: (row.contact_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminSupplier(input: UpsertSupplierInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackSuppliers.findIndex((row) => row.id === input.id);
      if (index !== -1) {
        fallbackSuppliers[index] = {
          ...fallbackSuppliers[index],
          name: input.name,
          contactName: input.contactName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackSuppliers.unshift({
      id: `sup-${Date.now()}`,
      name: input.name,
      contactName: input.contactName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    name: input.name,
    contact_name: input.contactName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("suppliers")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("suppliers").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminInventoryItems({
  search,
}: ListFilterParams = {}): Promise<AdminInventoryItem[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackInventoryItems.filter((item) =>
      includesSearch(
        `${item.sku} ${item.name} ${item.brand ?? ""} ${item.model ?? ""} ${item.caliber ?? ""}`,
        search,
      ),
    );
  }

  let query = serviceClient
    .from("inventory_items")
    .select(
      "id, sku, name, item_type, brand, model, caliber, quantity_on_hand, reorder_level, unit_cost, unit_price, location, notes, active, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      `sku.ilike.%${search}%,name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,caliber.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    sku: row.sku as string,
    name: row.name as string,
    itemType: row.item_type as InventoryItemType,
    brand: (row.brand as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    caliber: (row.caliber as string | null) ?? null,
    quantityOnHand: Number(row.quantity_on_hand),
    reorderLevel: Number(row.reorder_level),
    unitCost: (row.unit_cost as number | null) ?? null,
    unitPrice: (row.unit_price as number | null) ?? null,
    location: (row.location as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    active: Boolean(row.active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminInventoryItem(input: UpsertInventoryItemInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackInventoryItems.findIndex((item) => item.id === input.id);
      if (index !== -1) {
        fallbackInventoryItems[index] = {
          ...fallbackInventoryItems[index],
          sku: input.sku,
          name: input.name,
          itemType: input.itemType,
          brand: input.brand ?? null,
          model: input.model ?? null,
          caliber: input.caliber ?? null,
          quantityOnHand: input.quantityOnHand ?? 0,
          reorderLevel: input.reorderLevel ?? 0,
          unitCost: input.unitCost ?? null,
          unitPrice: input.unitPrice ?? null,
          location: input.location ?? null,
          notes: input.notes ?? null,
          active: input.active ?? true,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackInventoryItems.unshift({
      id: `inv-${Date.now()}`,
      sku: input.sku,
      name: input.name,
      itemType: input.itemType,
      brand: input.brand ?? null,
      model: input.model ?? null,
      caliber: input.caliber ?? null,
      quantityOnHand: input.quantityOnHand ?? 0,
      reorderLevel: input.reorderLevel ?? 0,
      unitCost: input.unitCost ?? null,
      unitPrice: input.unitPrice ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
      active: input.active ?? true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    sku: input.sku,
    name: input.name,
    item_type: input.itemType,
    brand: input.brand ?? null,
    model: input.model ?? null,
    caliber: input.caliber ?? null,
    quantity_on_hand: input.quantityOnHand ?? 0,
    reorder_level: input.reorderLevel ?? 0,
    unit_cost: input.unitCost ?? null,
    unit_price: input.unitPrice ?? null,
    location: input.location ?? null,
    notes: input.notes ?? null,
    active: input.active ?? true,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("inventory_items")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("inventory_items").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminCashbookEntries({
  search,
}: ListFilterParams = {}): Promise<AdminCashbookEntry[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackCashbookEntries.filter((entry) =>
      includesSearch(
        `${entry.category} ${entry.note ?? ""} ${entry.referenceType ?? ""} ${entry.referenceId ?? ""}`,
        search,
      ),
    );
  }

  let query = serviceClient
    .from("cashbook_entries")
    .select(
      "id, entry_date, entry_type, amount, category, payment_method, note, reference_type, reference_id, created_by, created_at",
    )
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(220);

  if (search) {
    query = query.or(
      `category.ilike.%${search}%,note.ilike.%${search}%,reference_type.ilike.%${search}%,reference_id.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    entryDate: row.entry_date as string,
    entryType: row.entry_type as CashEntryType,
    amount: Number(row.amount),
    category: row.category as string,
    paymentMethod: row.payment_method as PaymentMethod,
    note: (row.note as string | null) ?? null,
    referenceType: (row.reference_type as string | null) ?? null,
    referenceId: (row.reference_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function createAdminCashbookEntry(input: CreateCashbookEntryInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    fallbackCashbookEntries.unshift({
      id: `cash-${Date.now()}`,
      entryDate: input.entryDate ?? nowIso().slice(0, 10),
      entryType: input.entryType,
      amount: input.amount,
      category: input.category?.trim() || "general",
      paymentMethod: input.paymentMethod ?? "cash_on_delivery",
      note: input.note ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      createdBy: null,
      createdAt: nowIso(),
    });
    return;
  }

  const { error } = await serviceClient.from("cashbook_entries").insert({
    entry_date: input.entryDate ?? null,
    entry_type: input.entryType,
    amount: input.amount,
    category: input.category?.trim() || "general",
    payment_method: input.paymentMethod ?? "cash_on_delivery",
    note: input.note ?? null,
    reference_type: input.referenceType ?? null,
    reference_id: input.referenceId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createManualAdminOrder(input: CreateManualOrderInput) {
  const serviceClient = createSupabaseServiceClient();
  const round2 = (value: number) => Math.round(value * 100) / 100;
  const requestedProductIds = [
    ...new Set(input.items.map((item) => item.productId.trim()).filter(Boolean)),
  ];
  if (requestedProductIds.length === 0) {
    throw new Error("Select at least one product.");
  }

  const productsById = new Map<
    string,
    {
      id: string;
      title: string;
      brand: string;
      price: number;
    }
  >();

  if (!serviceClient) {
    for (const product of getFallbackProducts()) {
      if (product.status !== "active") {
        continue;
      }
      if (!requestedProductIds.includes(product.id)) {
        continue;
      }
      productsById.set(product.id, {
        id: product.id,
        title: product.title,
        brand: product.brand,
        price: Number(product.price),
      });
    }
  } else {
    const { data: productRows, error: productError } = await serviceClient
      .from("products")
      .select("id, title, brand, price, status")
      .in("id", requestedProductIds);

    if (productError || !productRows) {
      throw new Error(productError?.message ?? "Unable to load selected products.");
    }

    for (const row of productRows) {
      if (row.status !== "active") {
        continue;
      }
      productsById.set(String(row.id), {
        id: String(row.id),
        title: String(row.title),
        brand: String(row.brand),
        price: Number(row.price),
      });
    }
  }

  const orderLines = input.items.map((item) => {
    const productId = item.productId.trim();
    const product = productsById.get(productId);
    if (!product) {
      throw new Error("One or more selected products are not available.");
    }

    const quantity = Math.max(1, Math.trunc(item.quantity ?? 1));
    const unitPrice = round2(Number(item.sellingPrice ?? product.price));
    const lineSubtotal = round2(unitPrice * quantity);
    const rabatValue = Math.max(0, Number(item.rabat ?? 0));
    const lineDiscount =
      item.rabatType === "percent"
        ? round2(Math.min(lineSubtotal, lineSubtotal * (Math.min(100, rabatValue) / 100)))
        : round2(Math.min(rabatValue, lineSubtotal));
    const lineTotal = round2(Math.max(0, lineSubtotal - lineDiscount));

    return {
      productId: product.id,
      title: product.title,
      brand: product.brand,
      quantity,
      unitPrice,
      lineSubtotal,
      lineDiscount,
      lineTotal,
    };
  });

  const orderCode = generateOrderCode(Date.now() % 100000);
  const subtotal = round2(
    Number(
      input.subtotal ?? orderLines.reduce((sum, line) => sum + line.lineSubtotal, 0),
    ),
  );
  const deliveryFee = round2(Number(input.deliveryFee ?? 0));
  const discountAmount = round2(
    orderLines.reduce((sum, line) => sum + line.lineDiscount, 0),
  );
  const total =
    input.total ?? round2(Math.max(0, subtotal + deliveryFee - discountAmount));
  const now = nowIso();
  const orderStatus = input.orderStatus ?? "pending";
  const paymentStatus = input.paymentStatus ?? "pending";

  if (!serviceClient) {
    addFallbackOrder({
      id: `ord-${Date.now()}`,
      orderCode,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email?.trim() || null,
      country: input.country?.trim() || "Kosovo",
      city: input.city,
      address: input.address,
      notes: input.notes ?? null,
      internalNotes: input.internalNotes ?? "Created manually from admin operations",
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      orderStatus,
      subtotal,
      deliveryFee,
      total,
      createdAt: now,
      updatedAt: now,
      items: orderLines.map((line) => ({
        productId: line.productId,
        title: line.title,
        brand: line.brand,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.lineTotal,
      })),
      history: [
        {
          status: orderStatus,
          note: "Order created manually from admin operations",
          createdAt: now,
        },
      ],
    });
    return { orderCode };
  }

  const { data: orderRow, error: orderError } = await serviceClient
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_name: input.customerName,
      phone: input.phone,
      phone_normalized: normalizePhone(input.phone),
      email: input.email?.trim() || null,
      email_normalized: input.email?.trim() ? normalizeEmail(input.email) : null,
      country: input.country?.trim() || "Kosovo",
      city: input.city,
      address: input.address,
      notes: input.notes ?? null,
      internal_notes: input.internalNotes ?? "Created manually from admin operations",
      delivery_method: input.deliveryMethod,
      payment_method: input.paymentMethod,
      payment_status: paymentStatus,
      payment_provider:
        input.paymentMethod === "card_online"
          ? "stripe"
          : input.paymentMethod === "bank_transfer"
            ? "bank_transfer"
            : "manual_offline",
      payment_reference: null,
      order_status: orderStatus,
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      total,
    })
    .select("id")
    .single();

  if (orderError || !orderRow) {
    throw new Error(orderError?.message ?? "Unable to create manual order.");
  }

  const { error: historyError } = await serviceClient.from("order_status_history").insert({
    order_id: orderRow.id,
    status: orderStatus,
    note: "Order created manually from admin operations",
  });
  if (historyError) {
    throw new Error(historyError.message);
  }

  const { error: itemError } = await serviceClient.from("order_items").insert(
    orderLines.map((line) => ({
      order_id: orderRow.id,
      product_id: line.productId,
      product_title_snapshot: line.title,
      product_brand_snapshot: line.brand,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      total_price: line.lineTotal,
    })),
  );
  if (itemError) {
    throw new Error(itemError.message);
  }

  await syncOrderCashbookByOrderId(String(orderRow.id));

  return { orderCode };
}

export async function createManualAdminRepairRequest(input: CreateManualRepairRequestInput) {
  const serviceClient = createSupabaseServiceClient();
  const repairCode = generateRepairCode(Date.now() % 100000);
  const now = nowIso();
  const status = input.status ?? "request_received";

  if (!serviceClient) {
    addFallbackRepair({
      id: `rep-${Date.now()}`,
      repairCode,
      customerName: input.customerName,
      email: input.email?.trim() || null,
      phone: input.phone,
      preferredContactMethod: input.preferredContactMethod,
      itemType: input.itemType,
      brand: input.brand,
      model: input.model,
      serviceType: input.serviceType,
      description: input.description,
      status,
      estimatedCompletion: input.estimatedCompletion ?? null,
      amountDue: input.amountDue ?? null,
      notesInternal: input.notesInternal ?? null,
      notesCustomer: input.notesCustomer ?? "Kerkesa e servisit u regjistrua.",
      createdAt: now,
      updatedAt: now,
      history: [
        {
          status,
          note: "Repair request created manually from admin operations",
          createdAt: now,
          visibleToCustomer: true,
        },
      ],
      attachments: [],
    });
    return { repairCode };
  }

  const { data: repairRow, error: repairError } = await serviceClient
    .from("repair_requests")
    .insert({
      repair_code: repairCode,
      customer_name: input.customerName,
      email: input.email?.trim() || null,
      email_normalized: input.email?.trim() ? normalizeEmail(input.email) : null,
      phone: input.phone,
      phone_normalized: normalizePhone(input.phone),
      preferred_contact_method: input.preferredContactMethod,
      item_type: input.itemType,
      brand: input.brand,
      model: input.model,
      serial_number: null,
      purchase_date: null,
      service_type: input.serviceType,
      description: input.description,
      drop_off_method: input.dropOffMethod,
      status,
      estimated_completion: input.estimatedCompletion ?? null,
      amount_due: input.amountDue ?? null,
      notes_internal: input.notesInternal ?? null,
      notes_customer: input.notesCustomer ?? "Kerkesa e servisit u regjistrua.",
    })
    .select("id")
    .single();

  if (repairError || !repairRow) {
    throw new Error(repairError?.message ?? "Unable to create manual repair request.");
  }

  const { error: historyError } = await serviceClient.from("repair_status_history").insert({
    repair_request_id: repairRow.id,
    status,
    note: "Repair request created manually from admin operations",
    visible_to_customer: true,
  });

  if (historyError) {
    throw new Error(historyError.message);
  }

  return { repairCode };
}

export async function listAdminWatchBrands({
  search,
}: ListFilterParams = {}): Promise<AdminWatchBrand[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackWatchBrands.filter((item) =>
      includesSearch(`${item.name} ${item.country ?? ""}`, search),
    );
  }

  let query = serviceClient
    .from("watch_brands")
    .select("id, name, country, website, notes, created_at, updated_at")
    .order("name", { ascending: true })
    .limit(200);

  if (search) {
    query = query.or(`name.ilike.%${search}%,country.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    country: (row.country as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminWatchBrand(input: UpsertWatchBrandInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackWatchBrands.findIndex((item) => item.id === input.id);
      if (index !== -1) {
        fallbackWatchBrands[index] = {
          ...fallbackWatchBrands[index],
          name: input.name,
          country: input.country ?? null,
          website: input.website ?? null,
          notes: input.notes ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }
    fallbackWatchBrands.push({
      id: `wbr-${Date.now()}`,
      name: input.name,
      country: input.country ?? null,
      website: input.website ?? null,
      notes: input.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    name: input.name,
    country: input.country ?? null,
    website: input.website ?? null,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient.from("watch_brands").update(payload).eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("watch_brands").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminWatchCalibers({
  search,
}: ListFilterParams = {}): Promise<AdminWatchCaliber[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackWatchCalibers.filter((item) =>
      includesSearch(`${item.caliberName} ${item.movementType}`, search),
    );
  }

  let query = serviceClient
    .from("watch_calibers")
    .select(
      "id, brand_id, caliber_name, movement_type, power_reserve_hours, frequency_bph, jewels, diameter_mm, height_mm, has_hacking, has_hand_winding, notes, created_at, updated_at",
    )
    .order("caliber_name", { ascending: true })
    .limit(220);

  if (search) {
    query = query.or(`caliber_name.ilike.%${search}%,movement_type.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    brandId: (row.brand_id as string | null) ?? null,
    caliberName: row.caliber_name as string,
    movementType: row.movement_type as string,
    powerReserveHours: (row.power_reserve_hours as number | null) ?? null,
    frequencyBph: (row.frequency_bph as number | null) ?? null,
    jewels: (row.jewels as number | null) ?? null,
    diameterMm: (row.diameter_mm as number | null) ?? null,
    heightMm: (row.height_mm as number | null) ?? null,
    hasHacking: Boolean(row.has_hacking),
    hasHandWinding: Boolean(row.has_hand_winding),
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminWatchCaliber(input: UpsertWatchCaliberInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackWatchCalibers.findIndex((item) => item.id === input.id);
      if (index !== -1) {
        fallbackWatchCalibers[index] = {
          ...fallbackWatchCalibers[index],
          brandId: input.brandId ?? null,
          caliberName: input.caliberName,
          movementType: input.movementType,
          powerReserveHours: input.powerReserveHours ?? null,
          frequencyBph: input.frequencyBph ?? null,
          jewels: input.jewels ?? null,
          diameterMm: input.diameterMm ?? null,
          heightMm: input.heightMm ?? null,
          hasHacking: input.hasHacking ?? false,
          hasHandWinding: input.hasHandWinding ?? false,
          notes: input.notes ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }
    fallbackWatchCalibers.push({
      id: `wca-${Date.now()}`,
      brandId: input.brandId ?? null,
      caliberName: input.caliberName,
      movementType: input.movementType,
      powerReserveHours: input.powerReserveHours ?? null,
      frequencyBph: input.frequencyBph ?? null,
      jewels: input.jewels ?? null,
      diameterMm: input.diameterMm ?? null,
      heightMm: input.heightMm ?? null,
      hasHacking: input.hasHacking ?? false,
      hasHandWinding: input.hasHandWinding ?? false,
      notes: input.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    brand_id: input.brandId ?? null,
    caliber_name: input.caliberName,
    movement_type: input.movementType,
    power_reserve_hours: input.powerReserveHours ?? null,
    frequency_bph: input.frequencyBph ?? null,
    jewels: input.jewels ?? null,
    diameter_mm: input.diameterMm ?? null,
    height_mm: input.heightMm ?? null,
    has_hacking: input.hasHacking ?? false,
    has_hand_winding: input.hasHandWinding ?? false,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("watch_calibers")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("watch_calibers").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminWatchModels({
  search,
}: ListFilterParams = {}): Promise<AdminWatchModel[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackWatchModels.filter((item) =>
      includesSearch(`${item.modelName} ${item.collection ?? ""}`, search),
    );
  }

  let query = serviceClient
    .from("watch_models")
    .select("id, brand_id, model_name, collection, target_gender, notes, created_at, updated_at")
    .order("model_name", { ascending: true })
    .limit(220);

  if (search) {
    query = query.or(`model_name.ilike.%${search}%,collection.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    brandId: (row.brand_id as string | null) ?? null,
    modelName: row.model_name as string,
    collection: (row.collection as string | null) ?? null,
    targetGender: (row.target_gender as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminWatchModel(input: UpsertWatchModelInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackWatchModels.findIndex((item) => item.id === input.id);
      if (index !== -1) {
        fallbackWatchModels[index] = {
          ...fallbackWatchModels[index],
          brandId: input.brandId ?? null,
          modelName: input.modelName,
          collection: input.collection ?? null,
          targetGender: input.targetGender ?? null,
          notes: input.notes ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }
    fallbackWatchModels.push({
      id: `wmo-${Date.now()}`,
      brandId: input.brandId ?? null,
      modelName: input.modelName,
      collection: input.collection ?? null,
      targetGender: input.targetGender ?? null,
      notes: input.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    brand_id: input.brandId ?? null,
    model_name: input.modelName,
    collection: input.collection ?? null,
    target_gender: input.targetGender ?? null,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient.from("watch_models").update(payload).eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("watch_models").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminWatchReferences({
  search,
}: ListFilterParams = {}): Promise<AdminWatchReference[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackWatchReferences.filter((item) =>
      includesSearch(`${item.referenceCode} ${item.caseMaterial ?? ""} ${item.dialColor ?? ""}`, search),
    );
  }

  let query = serviceClient
    .from("watch_references")
    .select(
      "id, model_id, reference_code, caliber_id, case_size_mm, lug_width_mm, water_resistance_m, crystal, case_material, dial_color, strap_type, production_from_year, production_to_year, notes, created_at, updated_at",
    )
    .order("reference_code", { ascending: true })
    .limit(260);

  if (search) {
    query = query.or(`reference_code.ilike.%${search}%,dial_color.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    modelId: row.model_id as string,
    referenceCode: row.reference_code as string,
    caliberId: (row.caliber_id as string | null) ?? null,
    caseSizeMm: (row.case_size_mm as number | null) ?? null,
    lugWidthMm: (row.lug_width_mm as number | null) ?? null,
    waterResistanceM: (row.water_resistance_m as number | null) ?? null,
    crystal: (row.crystal as string | null) ?? null,
    caseMaterial: (row.case_material as string | null) ?? null,
    dialColor: (row.dial_color as string | null) ?? null,
    strapType: (row.strap_type as string | null) ?? null,
    productionFromYear: (row.production_from_year as number | null) ?? null,
    productionToYear: (row.production_to_year as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminWatchReference(input: UpsertWatchReferenceInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackWatchReferences.findIndex((item) => item.id === input.id);
      if (index !== -1) {
        fallbackWatchReferences[index] = {
          ...fallbackWatchReferences[index],
          modelId: input.modelId,
          referenceCode: input.referenceCode,
          caliberId: input.caliberId ?? null,
          caseSizeMm: input.caseSizeMm ?? null,
          lugWidthMm: input.lugWidthMm ?? null,
          waterResistanceM: input.waterResistanceM ?? null,
          crystal: input.crystal ?? null,
          caseMaterial: input.caseMaterial ?? null,
          dialColor: input.dialColor ?? null,
          strapType: input.strapType ?? null,
          productionFromYear: input.productionFromYear ?? null,
          productionToYear: input.productionToYear ?? null,
          notes: input.notes ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }
    fallbackWatchReferences.push({
      id: `wre-${Date.now()}`,
      modelId: input.modelId,
      referenceCode: input.referenceCode,
      caliberId: input.caliberId ?? null,
      caseSizeMm: input.caseSizeMm ?? null,
      lugWidthMm: input.lugWidthMm ?? null,
      waterResistanceM: input.waterResistanceM ?? null,
      crystal: input.crystal ?? null,
      caseMaterial: input.caseMaterial ?? null,
      dialColor: input.dialColor ?? null,
      strapType: input.strapType ?? null,
      productionFromYear: input.productionFromYear ?? null,
      productionToYear: input.productionToYear ?? null,
      notes: input.notes ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    model_id: input.modelId,
    reference_code: input.referenceCode,
    caliber_id: input.caliberId ?? null,
    case_size_mm: input.caseSizeMm ?? null,
    lug_width_mm: input.lugWidthMm ?? null,
    water_resistance_m: input.waterResistanceM ?? null,
    crystal: input.crystal ?? null,
    case_material: input.caseMaterial ?? null,
    dial_color: input.dialColor ?? null,
    strap_type: input.strapType ?? null,
    production_from_year: input.productionFromYear ?? null,
    production_to_year: input.productionToYear ?? null,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("watch_references")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("watch_references").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminInventoryCompatibility({
  search,
}: ListFilterParams = {}): Promise<AdminInventoryCompatibility[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackInventoryCompatibility.filter((row) =>
      includesSearch(
        `${row.inventoryItemId} ${row.caliberId ?? ""} ${row.modelId ?? ""} ${row.referenceId ?? ""}`,
        search,
      ),
    );
  }

  let query = serviceClient
    .from("inventory_item_compatibility")
    .select("id, inventory_item_id, caliber_id, model_id, reference_id, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(220);

  if (search) {
    query = query.or(
      `inventory_item_id.eq.${search},caliber_id.eq.${search},model_id.eq.${search},reference_id.eq.${search}`,
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    inventoryItemId: row.inventory_item_id as string,
    caliberId: (row.caliber_id as string | null) ?? null,
    modelId: (row.model_id as string | null) ?? null,
    referenceId: (row.reference_id as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function upsertAdminInventoryCompatibility(
  input: UpsertInventoryCompatibilityInput,
) {
  const hasTarget = Boolean(input.caliberId || input.modelId || input.referenceId);
  if (!hasTarget) {
    throw new Error("Select at least one compatibility target.");
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackInventoryCompatibility.findIndex((row) => row.id === input.id);
      if (index !== -1) {
        fallbackInventoryCompatibility[index] = {
          ...fallbackInventoryCompatibility[index],
          inventoryItemId: input.inventoryItemId,
          caliberId: input.caliberId ?? null,
          modelId: input.modelId ?? null,
          referenceId: input.referenceId ?? null,
          notes: input.notes ?? null,
        };
      }
      return;
    }
    fallbackInventoryCompatibility.unshift({
      id: `cpt-${Date.now()}`,
      inventoryItemId: input.inventoryItemId,
      caliberId: input.caliberId ?? null,
      modelId: input.modelId ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
      createdAt: nowIso(),
    });
    return;
  }

  const payload = {
    inventory_item_id: input.inventoryItemId,
    caliber_id: input.caliberId ?? null,
    model_id: input.modelId ?? null,
    reference_id: input.referenceId ?? null,
    notes: input.notes ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("inventory_item_compatibility")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("inventory_item_compatibility").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminRepairPartUsage({
  search,
}: ListFilterParams = {}): Promise<AdminRepairPartUsage[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackRepairPartUsage.filter((row) =>
      includesSearch(`${row.workOrderId} ${row.partName}`, search),
    );
  }

  let query = serviceClient
    .from("repair_parts_used")
    .select("id, work_order_id, inventory_item_id, part_name, quantity, unit_cost, created_at")
    .order("created_at", { ascending: false })
    .limit(220);

  if (search) {
    if (isUuid(search)) {
      query = query.eq("work_order_id", search.trim());
    } else {
      query = query.ilike("part_name", `%${search}%`);
    }
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    workOrderId: row.work_order_id as string,
    inventoryItemId: (row.inventory_item_id as string | null) ?? null,
    partName: row.part_name as string,
    quantity: Number(row.quantity),
    unitCost: Number(row.unit_cost),
    createdAt: row.created_at as string,
  }));
}

export async function createAdminRepairPartUsage(input: CreateRepairPartUsageInput) {
  const serviceClient = createSupabaseServiceClient();
  const quantity = Math.max(1, Math.trunc(input.quantity));
  if (!serviceClient) {
    const item = fallbackInventoryItems.find((row) => row.id === input.inventoryItemId);
    if (!item) {
      throw new Error("Inventory item not found.");
    }
    if (item.quantityOnHand < quantity) {
      throw new Error("Insufficient inventory stock.");
    }

    item.quantityOnHand -= quantity;
    item.updatedAt = nowIso();
    const unitCost = input.unitCost ?? item.unitCost ?? 0;

    fallbackRepairPartUsage.unshift({
      id: `rpu-${Date.now()}`,
      workOrderId: input.workOrderId,
      inventoryItemId: item.id,
      partName: item.name,
      quantity,
      unitCost,
      createdAt: nowIso(),
    });
    fallbackStockMovements.unshift({
      id: `mov-${Date.now()}`,
      productId: null,
      inventoryItemId: item.id,
      movementType: "repair_use",
      quantityDelta: quantity * -1,
      unitCost,
      referenceType: "repair_work_order",
      referenceId: input.workOrderId,
      note: input.note ?? "Part consumed in repair work order",
      createdAt: nowIso(),
    });
    return;
  }

  const { error } = await serviceClient.rpc("consume_inventory_for_work_order", {
    p_work_order_id: input.workOrderId,
    p_inventory_item_id: input.inventoryItemId,
    p_quantity: quantity,
    p_unit_cost: input.unitCost ?? null,
    p_note: input.note ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminPurchaseOrders({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminPurchaseOrder[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackPurchaseOrders
      .filter((order) => (status ? order.status === status : true))
      .filter((order) =>
        includesSearch(`${order.poNumber} ${order.notes ?? ""}`, search),
      );
  }

  let query = serviceClient
    .from("purchase_orders")
    .select(
      "id, po_number, supplier_id, status, ordered_at, received_at, notes, subtotal, total, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(140);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("po_number", `%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    poNumber: row.po_number as string,
    supplierId: (row.supplier_id as string | null) ?? null,
    status: row.status as PurchaseOrderStatus,
    orderedAt: (row.ordered_at as string | null) ?? null,
    receivedAt: (row.received_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminPurchaseOrder(input: UpsertPurchaseOrderInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackPurchaseOrders.findIndex((order) => order.id === input.id);
      if (index !== -1) {
        fallbackPurchaseOrders[index] = {
          ...fallbackPurchaseOrders[index],
          poNumber: input.poNumber,
          supplierId: input.supplierId ?? null,
          status: input.status,
          orderedAt: input.orderedAt ?? null,
          receivedAt: input.receivedAt ?? null,
          notes: input.notes ?? null,
          subtotal: input.subtotal ?? 0,
          total: input.total ?? 0,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackPurchaseOrders.unshift({
      id: `po-${Date.now()}`,
      poNumber: input.poNumber,
      supplierId: input.supplierId ?? null,
      status: input.status,
      orderedAt: input.orderedAt ?? null,
      receivedAt: input.receivedAt ?? null,
      notes: input.notes ?? null,
      subtotal: input.subtotal ?? 0,
      total: input.total ?? 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    po_number: input.poNumber,
    supplier_id: input.supplierId ?? null,
    status: input.status,
    ordered_at: input.orderedAt ?? null,
    received_at: input.receivedAt ?? null,
    notes: input.notes ?? null,
    subtotal: input.subtotal ?? 0,
    total: input.total ?? 0,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("purchase_orders")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("purchase_orders").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminStockMovements({
  search,
}: ListFilterParams = {}): Promise<AdminStockMovement[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackStockMovements.filter((movement) =>
      includesSearch(
        `${movement.referenceType ?? ""} ${movement.referenceId ?? ""} ${movement.note ?? ""}`,
        search,
      ),
    );
  }

  let query = serviceClient
    .from("stock_movements")
    .select(
      "id, product_id, inventory_item_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, note, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(220);

  if (search) {
    query = query.or(`reference_type.ilike.%${search}%,reference_id.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    productId: (row.product_id as string | null) ?? null,
    inventoryItemId: (row.inventory_item_id as string | null) ?? null,
    movementType: row.movement_type as StockMovementType,
    quantityDelta: Number(row.quantity_delta),
    unitCost: (row.unit_cost as number | null) ?? null,
    referenceType: (row.reference_type as string | null) ?? null,
    referenceId: (row.reference_id as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function createStockMovement(input: CreateStockMovementInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    fallbackStockMovements.unshift({
      id: `mov-${Date.now()}`,
      productId: input.productId ?? null,
      inventoryItemId: input.inventoryItemId ?? null,
      movementType: input.movementType,
      quantityDelta: input.quantityDelta,
      unitCost: input.unitCost ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      note: input.note ?? null,
      createdAt: nowIso(),
    });
    return;
  }

  const { error } = await serviceClient.from("stock_movements").insert({
    product_id: input.productId ?? null,
    inventory_item_id: input.inventoryItemId ?? null,
    movement_type: input.movementType,
    quantity_delta: input.quantityDelta,
    unit_cost: input.unitCost ?? null,
    reference_type: input.referenceType ?? null,
    reference_id: input.referenceId ?? null,
    note: input.note ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminWorkOrders({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminWorkOrder[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackWorkOrders
      .filter((workOrder) => (status ? workOrder.status === status : true))
      .filter((workOrder) =>
        includesSearch(
          `${workOrder.repairRequestId} ${workOrder.diagnosis ?? ""}`,
          search,
        ),
      );
  }

  let query = serviceClient
    .from("repair_work_orders")
    .select(
      "id, repair_request_id, status, diagnosis, estimate_amount, approved_by_customer, started_at, completed_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(140);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    if (isUuid(search)) {
      query = query.eq("repair_request_id", search.trim());
    }
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    repairRequestId: row.repair_request_id as string,
    status: row.status as WorkOrderStatus,
    diagnosis: (row.diagnosis as string | null) ?? null,
    estimateAmount: (row.estimate_amount as number | null) ?? null,
    approvedByCustomer: Boolean(row.approved_by_customer),
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminWorkOrder(input: UpsertWorkOrderInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackWorkOrders.findIndex((order) => order.id === input.id);
      if (index !== -1) {
        fallbackWorkOrders[index] = {
          ...fallbackWorkOrders[index],
          repairRequestId: input.repairRequestId,
          status: input.status,
          diagnosis: input.diagnosis ?? null,
          estimateAmount: input.estimateAmount ?? null,
          approvedByCustomer: input.approvedByCustomer ?? false,
          startedAt: input.startedAt ?? null,
          completedAt: input.completedAt ?? null,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackWorkOrders.unshift({
      id: `wo-${Date.now()}`,
      repairRequestId: input.repairRequestId,
      status: input.status,
      diagnosis: input.diagnosis ?? null,
      estimateAmount: input.estimateAmount ?? null,
      approvedByCustomer: input.approvedByCustomer ?? false,
      startedAt: input.startedAt ?? null,
      completedAt: input.completedAt ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    repair_request_id: input.repairRequestId,
    status: input.status,
    diagnosis: input.diagnosis ?? null,
    estimate_amount: input.estimateAmount ?? null,
    approved_by_customer: input.approvedByCustomer ?? false,
    started_at: input.startedAt ?? null,
    completed_at: input.completedAt ?? null,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("repair_work_orders")
      .update(payload)
      .eq("id", input.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("repair_work_orders").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function assignTechnicianToWorkOrder(input: AssignTechnicianInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    fallbackAssignments.unshift({
      id: `asg-${Date.now()}`,
      workOrderId: input.workOrderId,
      profileId: input.profileId ?? null,
      role: input.role,
      assignedAt: nowIso(),
    });
    return;
  }

  const { error } = await serviceClient.from("technician_assignments").upsert(
    {
      work_order_id: input.workOrderId,
      profile_id: input.profileId ?? null,
      role: input.role,
      assigned_at: nowIso(),
    },
    { onConflict: "work_order_id,profile_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
