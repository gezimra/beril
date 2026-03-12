import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import type { CashEntryType, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/domain";

const AUTO_REFERENCE_TYPE = "order_payment_auto";

type OrderCashbookRow = {
  id: string;
  order_code: string;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  updated_at: string;
};

function toPositiveMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value * 100) / 100);
}

function resolveAutoEntry(order: OrderCashbookRow): {
  entryType: CashEntryType;
  category: string;
  note: string;
} | null {
  if (order.order_status === "cancelled") {
    return null;
  }

  if (order.payment_status === "paid") {
    return {
      entryType: "inflow",
      category: "order_revenue",
      note: `Auto synced from order ${order.order_code} (paid).`,
    };
  }

  const isOfflinePayment =
    order.payment_method === "cash_on_delivery" ||
    order.payment_method === "pay_in_store";
  const isOperationallySettled =
    order.order_status === "delivered" || order.order_status === "completed";

  if (
    isOfflinePayment &&
    isOperationallySettled &&
    (order.payment_status === "pending" ||
      order.payment_status === "authorized" ||
      order.payment_status === "not_required")
  ) {
    return {
      entryType: "inflow",
      category: "order_revenue",
      note: `Auto synced from order ${order.order_code} (${order.order_status}).`,
    };
  }

  if (order.payment_status === "refunded") {
    return {
      entryType: "outflow",
      category: "order_refund",
      note: `Auto synced from order ${order.order_code} (refunded).`,
    };
  }

  return null;
}

export async function syncOrderCashbookByOrderId(orderId: string) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { data: order, error: orderError } = await serviceClient
    .from("orders")
    .select("id, order_code, total, payment_method, payment_status, order_status, updated_at")
    .eq("id", orderId)
    .maybeSingle<OrderCashbookRow>();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return;
  }

  const { error: clearError } = await serviceClient
    .from("cashbook_entries")
    .delete()
    .eq("reference_type", AUTO_REFERENCE_TYPE)
    .eq("reference_id", order.id);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const entry = resolveAutoEntry(order);
  if (!entry) {
    return;
  }

  const amount = toPositiveMoney(Number(order.total));
  if (amount <= 0) {
    return;
  }

  const entryDate = (() => {
    const parsed = new Date(order.updated_at);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString().slice(0, 10);
    }
    return parsed.toISOString().slice(0, 10);
  })();

  const { error: insertError } = await serviceClient.from("cashbook_entries").insert({
    entry_date: entryDate,
    entry_type: entry.entryType,
    amount,
    category: entry.category,
    payment_method: order.payment_method,
    note: entry.note,
    reference_type: AUTO_REFERENCE_TYPE,
    reference_id: order.id,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
