import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAuthenticatedCustomerUser,
  listOrdersForAuthenticatedCustomer,
} from "@/lib/db/customer-account";
import { formatEur } from "@/lib/utils/money";

export const metadata = {
  title: "My Orders",
  robots: {
    index: false,
    follow: false,
  },
};

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
                  <p className="text-sm text-graphite/72">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-graphite">{order.orderStatus}</p>
                  <p className="text-xs text-graphite/65">
                    payment: {order.paymentStatus} ({order.paymentMethod})
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-graphite/78">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-item-${index}`}>
                    {item.productTitle} ({item.productBrand}) x {item.quantity}
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
                <div className="flex items-center justify-between">
                  <dt className="text-graphite/68">Discount</dt>
                  <dd className="text-mineral">-{formatEur(order.discountAmount)}</dd>
                </div>
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

