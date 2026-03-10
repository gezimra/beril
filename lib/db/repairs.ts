import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { addFallbackRepair, getFallbackRepairs } from "@/lib/db/fallback-store";
import { generateRepairCode, normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type { AdminRepair } from "@/types/admin";
import type { RepairRequestInput } from "@/lib/validations/repair-request";
import type { RepairTrackResult } from "@/types/repair";
import { repairTrackSchema } from "@/lib/validations/repair-track";

interface CreateRepairResult {
  repairCode: string;
}

interface RepairRequestRow {
  id: string;
  repair_code: string;
  item_type: string;
  brand: string;
  model: string;
  created_at: string;
  estimated_completion: string | null;
  amount_due: number | null;
  notes_customer: string | null;
  status: RepairTrackResult["currentStatus"];
  phone_normalized: string;
  email_normalized: string | null;
}

interface RepairStatusRow {
  status: RepairTrackResult["currentStatus"];
  note: string | null;
  created_at: string;
}

export async function createRepairRequest(
  payload: RepairRequestInput,
): Promise<CreateRepairResult> {
  const serviceClient = createSupabaseServiceClient();
  const repairCode = generateRepairCode(Date.now() % 100000);

  if (!serviceClient) {
    const createdAt = new Date().toISOString();
    const fallbackRepair: AdminRepair = {
      id: `rep-${Date.now()}`,
      repairCode,
      customerName: payload.customerName,
      email: payload.email || null,
      phone: payload.phone,
      preferredContactMethod: payload.preferredContactMethod,
      itemType: payload.itemType,
      brand: payload.brand,
      model: payload.model,
      serviceType: payload.serviceType,
      description: payload.description,
      status:
        payload.dropOffMethod === "bring_to_store"
          ? "awaiting_drop_off"
          : "request_received",
      estimatedCompletion: null,
      amountDue: null,
      notesInternal: null,
      notesCustomer: "Repair request received.",
      createdAt,
      updatedAt: createdAt,
      history: [
        {
          status: "request_received",
          note: "Repair request received",
          createdAt,
          visibleToCustomer: true,
        },
      ],
    };
    if (payload.dropOffMethod === "bring_to_store") {
      fallbackRepair.history.push({
        status: "awaiting_drop_off",
        note: "Awaiting item drop-off",
        createdAt,
        visibleToCustomer: true,
      });
    }
    addFallbackRepair(fallbackRepair);

    return { repairCode };
  }

  const { data: repair, error: repairError } = await serviceClient
    .from("repair_requests")
    .insert({
      repair_code: repairCode,
      customer_name: payload.customerName,
      email: payload.email || null,
      email_normalized: payload.email ? normalizeEmail(payload.email) : null,
      phone: payload.phone,
      phone_normalized: normalizePhone(payload.phone),
      preferred_contact_method: payload.preferredContactMethod,
      item_type: payload.itemType,
      brand: payload.brand,
      model: payload.model,
      serial_number: payload.serialNumber || null,
      purchase_date: payload.purchaseDate || null,
      service_type: payload.serviceType,
      description: payload.description,
      drop_off_method: payload.dropOffMethod,
      status: "request_received",
    })
    .select("id")
    .single();

  if (repairError || !repair) {
    throw new Error(repairError?.message ?? "Unable to create repair request.");
  }

  const statusRows: Array<{
    repair_request_id: string;
    status: string;
    note: string | null;
    visible_to_customer: boolean;
  }> = [
    {
      repair_request_id: repair.id,
      status: "request_received",
      note: "Repair request received",
      visible_to_customer: true,
    },
  ];

  if (payload.dropOffMethod === "bring_to_store") {
    statusRows.push({
      repair_request_id: repair.id,
      status: "awaiting_drop_off",
      note: "Awaiting item drop-off",
      visible_to_customer: true,
    });
  }

  const { error: statusError } = await serviceClient
    .from("repair_status_history")
    .insert(statusRows);

  if (statusError) {
    throw new Error(statusError.message);
  }

  return { repairCode };
}

export async function trackRepairRequest(input: {
  repairCode: string;
  phoneOrEmail: string;
}): Promise<RepairTrackResult | null> {
  const parsed = repairTrackSchema.parse(input);
  const normalizedLookup = parsed.phoneOrEmail.includes("@")
    ? normalizeEmail(parsed.phoneOrEmail)
    : normalizePhone(parsed.phoneOrEmail);

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const normalizedLookup = parsed.phoneOrEmail.includes("@")
      ? normalizeEmail(parsed.phoneOrEmail)
      : normalizePhone(parsed.phoneOrEmail);

    const fallback = addFallbackLookup(normalizedLookup, parsed.repairCode);
    return fallback;
  }

  const { data: repair, error: repairError } = await serviceClient
    .from("repair_requests")
    .select(
      "id, repair_code, item_type, brand, model, created_at, estimated_completion, amount_due, notes_customer, status, phone_normalized, email_normalized",
    )
    .eq("repair_code", parsed.repairCode)
    .single();

  if (repairError || !repair) {
    return null;
  }

  const typedRepair = repair as RepairRequestRow;
  const canView =
    normalizedLookup === typedRepair.phone_normalized ||
    normalizedLookup === typedRepair.email_normalized;

  if (!canView) {
    return null;
  }

  const { data: history } = await serviceClient
    .from("repair_status_history")
    .select("status, note, created_at")
    .eq("repair_request_id", typedRepair.id)
    .eq("visible_to_customer", true)
    .order("created_at", { ascending: true });

  const timeline =
    (history as RepairStatusRow[] | null)?.map((entry) => ({
      status: entry.status,
      note: entry.note,
      createdAt: entry.created_at,
    })) ?? [];

  return {
    repairCode: typedRepair.repair_code,
    itemType: typedRepair.item_type,
    brand: typedRepair.brand,
    model: typedRepair.model,
    dateReceived: typedRepair.created_at,
    estimatedCompletion: typedRepair.estimated_completion,
    amountDue: typedRepair.amount_due,
    customerNote: typedRepair.notes_customer,
    currentStatus: typedRepair.status,
    timeline,
  };
}

function addFallbackLookup(
  normalizedLookup: string,
  repairCode: string,
): RepairTrackResult | null {
  const match = getFallbackRepairs().find((repair) => {
    if (repair.repairCode !== repairCode) {
      return false;
    }

    return (
      normalizePhone(repair.phone) === normalizedLookup ||
      (repair.email ? normalizeEmail(repair.email) === normalizedLookup : false)
    );
  });

  if (!match) {
    return null;
  }

  return {
    repairCode: match.repairCode,
    itemType: match.itemType,
    brand: match.brand,
    model: match.model,
    dateReceived: match.createdAt,
    estimatedCompletion: match.estimatedCompletion,
    amountDue: match.amountDue,
    customerNote: match.notesCustomer,
    currentStatus: match.status,
    timeline: match.history.map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.createdAt,
    })),
  };
}
