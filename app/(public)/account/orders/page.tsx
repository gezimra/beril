import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAuthenticatedCustomerUser,
  listOrdersForAuthenticatedCustomer,
} from "@/lib/db/customer-account";
import { formatEur } from "@/lib/utils/money";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/domain";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Orders",
  robots: {
    index: false,
    follow: false,
  },
};

function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    ready_for_pickup: "Ready for Pickup",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

function paymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pending",
    not_required: "Not Required",
    authorized: "Authorized",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

function paymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash_on_delivery: "Cash on Delivery",
    pay_in_store: "Pay in Store",
    card_online: "Card Online",
    bank_transfer: "Bank Transfer",
  };
  return labels[method] ?? method;
}

function formatOrderDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CustomerOrdersPage() {
  const user = await getAuthenticatedCustomerUser();
  if (!user) {
    redirect("/account/login?next=/account/orders");
  }

  const orders = await listOrdersForAuthenticatedCustomer();

  return (
    <article className="surface-panel p-6 sm:p-8">
      <StatusBadge tone="service">Orders</StatusBadge>
      <h1 className="mt-3 text-4xl text-graphite">My Orders</h1>
      <p className="mt-2 text-sm text-graphite/74">Track your order history and status.</p>

      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-graphite/12 bg-white/75 p-4 text-sm text-graphite/72">
            No orders found for this account yet.
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl border border-graphite/12 bg-white/75 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
                    {order.orderCode}
                  </p>
                  <p className="text-sm text-graphite/72">{formatOrderDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-graphite">
                    {orderStatusLabel(order.orderStatus)}
                  </p>
                  <p className="text-xs text-graphite/65">
                    {paymentStatusLabel(order.paymentStatus)} &middot;{" "}
                    {paymentMethodLabel(order.paymentMethod)}
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-graphite/78">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-item-${index}`}>
                    {item.productTitle} ({item.productBrand}) &times; {item.quantity}
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-graphite/68">Subtotal</dt>
                  <dd>{formatEur(order.subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-graphite/68">Delivery</dt>
                  <dd>{formatEur(order.deliveryFee)}</dd>
                </div>
                {order.discountAmount > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-graphite/68">Discount</dt>
                    <dd className="text-mineral">-{formatEur(order.discountAmount)}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between font-medium">
                  <dt>Total</dt>
                  <dd>{formatEur(order.total)}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </article>
  );
}
