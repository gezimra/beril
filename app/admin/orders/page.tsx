import {
  updateOrderNotesAction,
  updateOrderPaymentStatusAction,
  updateOrderStatusAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
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

function OrderEditForms({ order }: { order: Awaited<ReturnType<typeof listAdminOrders>>[number] }) {
  return (
    <details>
      <summary className="cursor-pointer text-xs uppercase tracking-[0.12em] text-graphite/45 hover:text-graphite/70 select-none py-1">
        Edit
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <form action={updateOrderStatusAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
          <input type="hidden" name="orderId" value={order.id} />
          <FloatSelect label="Update status" name="status" defaultValue={order.orderStatus}>
            {orderStatuses.map((item) => (
              <option key={item} value={item}>{formatStatusLabel(item)}</option>
            ))}
          </FloatSelect>
          <FloatInput label="Status note" name="note" />
          <button type="submit" className={buttonVariants({ variant: "mineral", size: "adminSm" })}>
            Save Status
          </button>
        </form>

        <form action={updateOrderPaymentStatusAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
          <input type="hidden" name="orderId" value={order.id} />
          <FloatSelect label="Payment status" name="paymentStatus" defaultValue={order.paymentStatus}>
            {paymentStatuses.map((item) => (
              <option key={item} value={item}>{formatStatusLabel(item)}</option>
            ))}
          </FloatSelect>
          <button type="submit" className={buttonVariants({ variant: "primary", size: "adminSm" })}>
            Save Payment
          </button>
        </form>

        <form action={updateOrderNotesAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
          <input type="hidden" name="orderId" value={order.id} />
          <FloatTextarea label="Internal notes" name="internalNotes" rows={3} defaultValue={order.internalNotes ?? ""} />
          <button type="submit" className={buttonVariants({ variant: "secondary", size: "adminSm" })}>
            Save Notes
          </button>
        </form>
      </div>
    </details>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));
  const orders = await listAdminOrders({ search, status, page });

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
        <FloatInput label="Search" name="search" defaultValue={search} />
        <FloatSelect label="Status" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {orderStatuses.map((item) => (
            <option key={item} value={item}>{formatStatusLabel(item)}</option>
          ))}
        </FloatSelect>
        <button type="submit" className={buttonVariants({ variant: "primary", size: "adminMd" })}>
          Apply
        </button>
      </form>

      {orders.length === 0 ? (
        <div className="surface-panel p-6 text-sm text-graphite/75">No orders found for current filters.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <div key={order.id} className="surface-panel p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-graphite/55">{order.orderCode}</p>
                    <p className="mt-0.5 font-medium text-graphite">{order.customerName}</p>
                    <p className="text-xs text-graphite/55">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge tone="premium">{formatStatusLabel(order.orderStatus)}</StatusBadge>
                </div>
                <div className="text-xs text-graphite/65 space-y-0.5">
                  {order.items.map((item, i) => (
                    <p key={i}>{item.title} ×{item.quantity}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-graphite/65">
                  <span>€{order.total.toFixed(2)} · {formatStatusLabel(order.paymentMethod)}</span>
                  <span>{formatStatusLabel(order.paymentStatus)}</span>
                </div>
                <OrderEditForms order={order} />
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="surface-panel hidden overflow-x-auto p-4 md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                <tr>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Contact</th>
                  <th className="px-2 py-2">Items</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Payment</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <tr key={order.id} className="border-t border-graphite/10">
                      <td className="px-2 py-3 font-medium text-graphite">{order.orderCode}</td>
                      <td className="px-2 py-3 text-graphite/65 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-3 text-graphite">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-graphite/55">{order.city}, {order.country}</div>
                      </td>
                      <td className="px-2 py-3 text-graphite/65 text-xs">
                        <div>{order.phone}</div>
                        {order.email && <div>{order.email}</div>}
                      </td>
                      <td className="px-2 py-3 text-graphite/65 text-xs max-w-[12rem]">
                        {order.items.map((item, i) => (
                          <div key={i}>{item.title} ×{item.quantity}</div>
                        ))}
                      </td>
                      <td className="px-2 py-3 text-graphite whitespace-nowrap">€{order.total.toFixed(2)}</td>
                      <td className="px-2 py-3 text-xs text-graphite/65">
                        <div>{formatStatusLabel(order.paymentMethod)}</div>
                        <div>{formatStatusLabel(order.paymentStatus)}</div>
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge tone="premium">{formatStatusLabel(order.orderStatus)}</StatusBadge>
                      </td>
                    </tr>
                    <tr key={`${order.id}-edit`} className="border-b border-graphite/8">
                      <td colSpan={8} className="px-2 pb-3">
                        <OrderEditForms order={order} />
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination
        page={page}
        hasMore={orders.length === 20}
        searchParams={{ search: search || undefined, status: status || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
