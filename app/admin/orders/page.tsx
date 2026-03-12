import {
  updateOrderNotesAction,
  updateOrderPaymentStatusAction,
  updateOrderStatusAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrders } from "@/lib/db/admin";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { orderStatuses, paymentStatuses } from "@/types/domain";

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const orders = await listAdminOrders({ search, status });

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Orders</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Orders Management</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Search and update order statuses, notes, and completion states.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <FloatInput
          label="Search"
          name="search"
          defaultValue={search}
        />
        <FloatSelect
          label="Status"
          name="status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          {orderStatuses.map((item) => (
            <option key={item} value={item}>
              {formatStatusLabel(item)}
            </option>
          ))}
        </FloatSelect>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Apply
        </button>
      </form>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="surface-panel p-6 text-sm text-graphite/75">
            No orders found for current filters.
          </div>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="surface-panel space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
                    {order.orderCode}
                  </p>
                  <h2 className="mt-1 text-2xl text-graphite">
                    {order.customerName}
                  </h2>
                  <p className="mt-1 text-sm text-graphite/72">
                    {order.phone}
                    {order.email ? ` | ${order.email}` : ""}
                  </p>
                  <p className="text-sm text-graphite/72">
                    {order.city}, {order.country} | {order.address}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.1em] text-graphite/62">
                    {formatStatusLabel(order.paymentMethod)} | {formatStatusLabel(order.paymentStatus)}
                  </p>
                </div>
                <StatusBadge tone="premium">{formatStatusLabel(order.orderStatus)}</StatusBadge>
              </div>

              <div className="rounded-lg border border-graphite/10 bg-white/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                  Items
                </p>
                <ul className="mt-2 space-y-1 text-sm text-graphite/78">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-item-${index}`}>
                      {item.title} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <form action={updateOrderStatusAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <FloatSelect
                    label="Update status"
                    name="status"
                    defaultValue={order.orderStatus}
                  >
                    {orderStatuses.map((item) => (
                      <option key={item} value={item}>
                        {formatStatusLabel(item)}
                      </option>
                    ))}
                  </FloatSelect>
                  <FloatInput
                    label="Status note"
                    name="note"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
                  >
                    Save Status
                  </button>
                </form>

                <form action={updateOrderPaymentStatusAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <FloatSelect
                    label="Payment status"
                    name="paymentStatus"
                    defaultValue={order.paymentStatus}
                  >
                    {paymentStatuses.map((item) => (
                      <option key={item} value={item}>
                        {formatStatusLabel(item)}
                      </option>
                    ))}
                  </FloatSelect>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
                  >
                    Save Payment
                  </button>
                </form>

                <form action={updateOrderNotesAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <FloatTextarea
                    label="Internal notes"
                    name="internalNotes"
                    rows={3}
                    defaultValue={order.internalNotes ?? ""}
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                  >
                    Save Notes
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </Container>
  );
}
