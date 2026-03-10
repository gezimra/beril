import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import type {
  AdminPurchaseOrder,
  AdminStockMovement,
  AdminSupplier,
  AdminTechnicianAssignment,
  AdminWorkOrder,
} from "@/types/admin";
import type {
  PurchaseOrderStatus,
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
  movementType: StockMovementType;
  quantityDelta: number;
  unitCost?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
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
      "id, product_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, note, created_at",
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
