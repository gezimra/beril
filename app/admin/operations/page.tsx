import {
  createStockMovementAction,
  upsertPurchaseOrderAction,
  upsertSupplierAction,
  upsertWorkOrderAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminPurchaseOrders,
  listAdminStockMovements,
  listAdminSuppliers,
  listAdminWorkOrders,
} from "@/lib/db/inventory-ops";
import { purchaseOrderStatuses, stockMovementTypes, workOrderStatuses } from "@/types/domain";

type AdminOperationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminOperationsPage({
  searchParams,
}: AdminOperationsPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);

  const [suppliers, purchaseOrders, stockMovements, workOrders] = await Promise.all([
    listAdminSuppliers({ search }),
    listAdminPurchaseOrders({ search, status }),
    listAdminStockMovements({ search }),
    listAdminWorkOrders({ search, status }),
  ]);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Operations</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Inventory and Repair Operations</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Manage suppliers, purchase orders, stock movements, and repair work orders.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by ID, PO number, notes"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Array.from(new Set([...purchaseOrderStatuses, ...workOrderStatuses])).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Apply
        </button>
      </form>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Suppliers</h2>
          <form action={upsertSupplierAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input
              name="name"
              required
              placeholder="Supplier name"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="contactName"
                placeholder="Contact person"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="phone"
                placeholder="Phone"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <textarea
              name="notes"
              rows={2}
              placeholder="Notes"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save Supplier
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {suppliers.length === 0 ? (
              <li className="text-graphite/72">No suppliers.</li>
            ) : (
              suppliers.map((supplier) => (
                <li key={supplier.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{supplier.name}</p>
                  <p className="text-xs text-graphite/62">
                    {supplier.email ?? "-"} | {supplier.phone ?? "-"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Purchase Orders</h2>
          <form action={upsertPurchaseOrderAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input
              name="poNumber"
              required
              placeholder="PO-2026-0001"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <select
              name="supplierId"
              defaultValue=""
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              <option value="">No supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                name="status"
                defaultValue="draft"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                {purchaseOrderStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                name="subtotal"
                type="number"
                min="0"
                step="0.01"
                placeholder="Subtotal"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="total"
                type="number"
                min="0"
                step="0.01"
                placeholder="Total"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="orderedAt"
                type="datetime-local"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="receivedAt"
                type="datetime-local"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="notes"
              rows={2}
              placeholder="Notes"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save PO
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {purchaseOrders.length === 0 ? (
              <li className="text-graphite/72">No purchase orders.</li>
            ) : (
              purchaseOrders.map((order) => (
                <li key={order.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{order.poNumber}</p>
                  <p className="text-xs text-graphite/62">
                    {order.status} | {order.total} EUR
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Stock Movements</h2>
          <form action={createStockMovementAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input
              name="productId"
              placeholder="Product ID"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                name="movementType"
                defaultValue="manual_adjustment"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                {stockMovementTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                name="quantityDelta"
                type="number"
                required
                placeholder="+/- qty"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="referenceType"
                placeholder="Reference type"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="referenceId"
                placeholder="Reference ID"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <input
              name="unitCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit cost EUR"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <textarea
              name="note"
              rows={2}
              placeholder="Notes"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Add Movement
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {stockMovements.length === 0 ? (
              <li className="text-graphite/72">No stock movements.</li>
            ) : (
              stockMovements.slice(0, 12).map((movement) => (
                <li key={movement.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">
                    {movement.movementType}: {movement.quantityDelta}
                  </p>
                  <p className="text-xs text-graphite/62">
                    {movement.referenceType ?? "-"} | {movement.referenceId ?? "-"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Repair Work Orders</h2>
          <form action={upsertWorkOrderAction} className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input
              name="repairRequestId"
              required
              placeholder="Repair request ID"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue="pending"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              {workOrderStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <textarea
              name="diagnosis"
              rows={2}
              placeholder="Diagnosis"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="estimateAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Estimate EUR"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm text-graphite/74">
                <input type="checkbox" name="approvedByCustomer" />
                Approved by customer
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="startedAt"
                type="datetime-local"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="completedAt"
                type="datetime-local"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save Work Order
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {workOrders.length === 0 ? (
              <li className="text-graphite/72">No work orders.</li>
            ) : (
              workOrders.map((workOrder) => (
                <li key={workOrder.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{workOrder.repairRequestId}</p>
                  <p className="text-xs text-graphite/62">
                    {workOrder.status} | {workOrder.estimateAmount ?? 0} EUR
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </Container>
  );
}

