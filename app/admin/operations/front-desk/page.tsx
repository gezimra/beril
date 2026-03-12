import Link from "next/link";

import {
  createManualOrderAction,
  createManualRepairRequestAction,
} from "@/app/admin/actions";
import { CustomerLookupFields } from "@/components/admin/customer-lookup-fields";
import { ManualOrderItemsField } from "@/components/admin/manual-order-items-field";
import { ManualServiceItemsField } from "@/components/admin/manual-service-items-field";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrders, listAdminProducts, listAdminRepairs } from "@/lib/db/admin";
import { formatStatusLabel } from "@/lib/utils/status-label";
import {
  deliveryMethods,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  preferredContactMethods,
  repairStatuses,
} from "@/types/domain";

type AdminFrontDeskPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminFrontDeskPage({ searchParams }: AdminFrontDeskPageProps) {
  const query = await searchParams;
  const intakeParam = query.intake;
  const intakeValue = Array.isArray(intakeParam) ? intakeParam[0] : intakeParam;
  const activeIntake = intakeValue === "service" ? "service" : "order";
  const [recentOrders, recentRepairs, activeProducts] = await Promise.all([
    listAdminOrders(),
    listAdminRepairs(),
    listAdminProducts({ status: "active" }),
  ]);

  return (
    <div className="min-w-0 max-w-[96rem] space-y-3 sm:space-y-5 lg:space-y-6">
      <header className="surface-panel p-4 sm:p-5 lg:p-6">
        <StatusBadge tone="service">Front Desk</StatusBadge>
        <h1 className="mt-2 text-3xl text-graphite sm:mt-3 sm:text-4xl">In-Store Intake</h1>
        <p className="mt-1.5 text-sm text-graphite/74 sm:mt-2">
          Register manual sales and service requests in the same pipelines used by the website.
        </p>
      </header>

      <section className="surface-panel min-w-0 p-2.5 sm:p-4 lg:p-5">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-graphite/10 bg-white/72 p-1">
          <Link
            href="/admin/operations/front-desk?intake=order"
            className={`inline-flex h-8 min-w-0 items-center justify-center rounded-xl px-2 text-[0.62rem] uppercase tracking-[0.08em] transition sm:h-9 sm:rounded-full sm:px-4 sm:text-xs ${
              activeIntake === "order"
                ? "border border-walnut/35 bg-walnut/12 text-walnut shadow-[0_10px_24px_-18px_rgba(47,75,68,0.7)]"
                : "text-graphite/72 hover:bg-white/75 hover:text-graphite"
            }`}
          >
            <span className="truncate sm:hidden">Order Intake</span>
            <span className="hidden sm:inline">Manual Order Intake</span>
          </Link>
          <Link
            href="/admin/operations/front-desk?intake=service"
            className={`inline-flex h-8 min-w-0 items-center justify-center rounded-xl px-2 text-[0.62rem] uppercase tracking-[0.08em] transition sm:h-9 sm:rounded-full sm:px-4 sm:text-xs ${
              activeIntake === "service"
                ? "border border-mineral/35 bg-mineral/14 text-mineral shadow-[0_10px_24px_-18px_rgba(47,75,68,0.7)]"
                : "text-graphite/72 hover:bg-white/75 hover:text-graphite"
            }`}
          >
            <span className="truncate sm:hidden">Service Intake</span>
            <span className="hidden sm:inline">Manual Service Intake</span>
          </Link>
        </div>

        {activeIntake === "order" ? (
          <article className="mt-2.5 min-w-0 rounded-lg border border-graphite/12 bg-white/72 p-2.5 sm:mt-4 sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <h2 className="text-2xl leading-none text-graphite">Manual Order Intake</h2>
              <Link
                href="/admin/orders"
                className="text-xs uppercase tracking-[0.12em] text-graphite/72"
              >
                View Orders
              </Link>
            </div>
            <p className="mt-1 text-xs text-graphite/62">
              Register in-store, phone, or social orders into the same order pipeline.
            </p>

            <form
              action={createManualOrderAction}
              className="mt-2.5 min-w-0 space-y-3 rounded-lg border border-graphite/12 bg-white/70 p-2.5 sm:mt-3 sm:space-y-3.5 sm:p-3"
            >
              <input
                type="hidden"
                name="returnTo"
                value="/admin/operations/front-desk?intake=order"
              />

              <section className="space-y-2 rounded-xl border border-mineral/16 bg-mineral/[0.05] p-2.5 sm:p-3">
                <header className="space-y-0.5">
                  <p className="text-xs uppercase tracking-[0.14em] text-mineral/78">Customer</p>
                  <p className="text-xs text-graphite/62">Find an existing customer or create a new one.</p>
                </header>
                <CustomerLookupFields mode="order" />
              </section>

              <section className="space-y-2 rounded-xl border border-walnut/18 bg-walnut/[0.05] p-2.5 sm:p-3">
                <header className="space-y-0.5">
                  <p className="text-xs uppercase tracking-[0.14em] text-walnut/86">Items and Pricing</p>
                  <p className="text-xs text-graphite/62">Search products, set quantity, unit price override, and rabat.</p>
                </header>
                <ManualOrderItemsField
                  products={activeProducts.map((product) => ({
                    id: product.id,
                    brand: product.brand,
                    title: product.title,
                    price: product.price,
                  }))}
                />
              </section>

              <details className="admin-advanced border-mineral/20 bg-mineral/[0.04]">
                <summary>Advanced order fields</summary>
                <div className="space-y-2 px-3 pb-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <FloatInput name="email" type="email" label="Email" />
                    <FloatInput name="country" defaultValue="Kosovo" label="Country" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <FloatSelect name="deliveryMethod" defaultValue="home_delivery" label="Delivery">
                      {deliveryMethods.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </FloatSelect>
                    <FloatSelect
                      name="paymentMethod"
                      defaultValue="cash_on_delivery"
                      label="Payment method"
                    >
                      {paymentMethods.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </FloatSelect>
                    <FloatSelect name="orderStatus" defaultValue="pending" label="Order status">
                      {orderStatuses.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </FloatSelect>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <FloatInput
                      name="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      label="Delivery fee"
                    />
                    <div className="hidden sm:block" />
                    <FloatInput
                      name="total"
                      type="number"
                      step="0.01"
                      min="0"
                      label="Final total override (optional)"
                    />
                  </div>
                  <p className="-mt-1 text-xs text-graphite/58">
                    Uses your custom final order amount for this order only. Product prices stay unchanged.
                  </p>
                  <FloatSelect name="paymentStatus" defaultValue="pending" label="Payment status">
                    {paymentStatuses.map((item) => (
                      <option key={item} value={item}>
                        {formatStatusLabel(item)}
                      </option>
                    ))}
                  </FloatSelect>
                  <FloatTextarea name="notes" rows={2} label="Customer notes" />
                  <FloatTextarea name="internalNotes" rows={2} label="Internal notes" />
                </div>
              </details>

              <div className="rounded-xl border border-graphite/14 bg-white/80 p-2.5 sm:p-3">
                <button
                  type="submit"
                  className="admin-primary-btn-walnut w-full sm:w-auto"
                >
                  Create Manual Order
                </button>
              </div>
            </form>
          </article>
        ) : (
          <article className="mt-2.5 min-w-0 rounded-lg border border-graphite/12 bg-white/72 p-2.5 sm:mt-4 sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <h2 className="text-2xl leading-none text-graphite">Manual Service Intake</h2>
              <Link
                href="/admin/repairs"
                className="text-xs uppercase tracking-[0.12em] text-graphite/72"
              >
                View Repairs
              </Link>
            </div>
            <p className="mt-1 text-xs text-graphite/62">
              Register walk-in service requests directly into repair tracking.
            </p>

            <form
              action={createManualRepairRequestAction}
              className="mt-2.5 min-w-0 space-y-3 rounded-lg border border-graphite/12 bg-white/70 p-2.5 sm:mt-3 sm:space-y-3.5 sm:p-3"
            >
              <input
                type="hidden"
                name="returnTo"
                value="/admin/operations/front-desk?intake=service"
              />

              <section className="space-y-2 rounded-xl border border-mineral/16 bg-mineral/[0.05] p-2.5 sm:p-3">
                <header className="space-y-0.5">
                  <p className="text-xs uppercase tracking-[0.14em] text-mineral/78">Customer</p>
                  <p className="text-xs text-graphite/62">Find an existing customer or create a new one.</p>
                </header>
                <CustomerLookupFields mode="service" />
              </section>

              <section className="space-y-2 rounded-xl border border-walnut/18 bg-walnut/[0.05] p-2.5 sm:p-3">
                <header className="space-y-0.5">
                  <p className="text-xs uppercase tracking-[0.14em] text-walnut/86">Service Intake</p>
                  <p className="text-xs text-graphite/62">Capture one or multiple items from the same customer visit.</p>
                </header>
                <ManualServiceItemsField />
              </section>

              <details className="admin-advanced border-mineral/20 bg-mineral/[0.04]">
                <summary>Advanced service fields</summary>
                <div className="space-y-2 px-3 pb-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <FloatInput name="email" type="email" label="Email" />
                    <FloatSelect
                      name="preferredContactMethod"
                      defaultValue="phone"
                      label="Preferred contact"
                    >
                      {preferredContactMethods.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </FloatSelect>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <FloatSelect name="dropOffMethod" defaultValue="already_dropped_off" label="Drop-off">
                      <option value="already_dropped_off">Already dropped off</option>
                      <option value="bring_to_store">Bring to store</option>
                      <option value="contact_me_first">Contact me first</option>
                    </FloatSelect>
                    <FloatSelect name="status" defaultValue="received_in_store" label="Repair status">
                      {repairStatuses.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </FloatSelect>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <FloatInput name="estimatedCompletion" type="date" label="Estimated completion" />
                    <FloatInput
                      name="amountDue"
                      type="number"
                      min="0"
                      step="0.01"
                      label="Amount due EUR"
                    />
                  </div>
                  <FloatTextarea name="notesCustomer" rows={2} label="Customer-visible note" />
                  <FloatTextarea name="notesInternal" rows={2} label="Internal note" />
                </div>
              </details>

            </form>
          </article>
        )}
      </section>

      <section className="grid gap-3 sm:gap-5 xl:grid-cols-2">
        <article className="surface-panel p-3.5 sm:p-4 lg:p-5">
          <h2 className="text-2xl text-graphite">Recent Orders</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentOrders.length === 0 ? (
              <li className="text-graphite/72">No orders yet.</li>
            ) : (
              recentOrders.slice(0, 6).map((order) => (
                <li key={order.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{order.orderCode}</p>
                  <p className="text-xs text-graphite/62">
                    {order.customerName} | {formatStatusLabel(order.orderStatus)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-3.5 sm:p-4 lg:p-5">
          <h2 className="text-2xl text-graphite">Recent Repairs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentRepairs.length === 0 ? (
              <li className="text-graphite/72">No repairs yet.</li>
            ) : (
              recentRepairs.slice(0, 6).map((repair) => (
                <li key={repair.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{repair.repairCode}</p>
                  <p className="text-xs text-graphite/62">
                    {repair.customerName} | {formatStatusLabel(repair.status)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
