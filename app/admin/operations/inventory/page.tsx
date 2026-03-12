import {
  createStockMovementAction,
  upsertInventoryItemAction,
  upsertPurchaseOrderAction,
  upsertSupplierAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminInventoryItems,
  listAdminPurchaseOrders,
  listAdminStockMovements,
  listAdminSuppliers,
} from "@/lib/db/inventory-ops";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { inventoryItemTypes, purchaseOrderStatuses, stockMovementTypes } from "@/types/domain";

type AdminInventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminInventoryPage({ searchParams }: AdminInventoryPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);

  const [suppliers, purchaseOrders, inventoryItems, stockMovements] = await Promise.all([
    listAdminSuppliers({ search }),
    listAdminPurchaseOrders({ search, status }),
    listAdminInventoryItems({ search }),
    listAdminStockMovements({ search }),
  ]);

  const lowStockItems = inventoryItems.filter(
    (item) => item.active && item.quantityOnHand <= item.reorderLevel,
  );

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Inventory</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Inventory and Procurement</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Manage suppliers, purchase orders, stock movements, and parts inventory.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Suppliers</p>
          <p className="mt-2 text-3xl text-graphite">{suppliers.length}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Open POs</p>
          <p className="mt-2 text-3xl text-graphite">
            {purchaseOrders.filter((item) => item.status !== "received").length}
          </p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Low Stock Items</p>
          <p className="mt-2 text-3xl text-graphite">{lowStockItems.length}</p>
        </article>
      </section>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <FloatInput name="search" defaultValue={search} label="Search by supplier, SKU, PO number" />
        <FloatSelect name="status" defaultValue={status} label="PO status">
          <option value="">All PO statuses</option>
          {purchaseOrderStatuses.map((item) => (
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

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Suppliers</h2>
          <form
            action={upsertSupplierAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/inventory" />
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="name" required label="Supplier name" />
              <PhoneInput name="phone" label="Phone" />
            </div>
            <details className="admin-advanced">
              <summary>Advanced supplier fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <FloatInput name="contactName" label="Contact person" />
                <FloatInput name="email" type="email" label="Email" />
                <FloatTextarea name="notes" rows={2} label="Notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
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
          <form
            action={upsertPurchaseOrderAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/inventory" />
            <FloatInput name="poNumber" required label="PO-2026-0001" />
            <FloatSelect name="supplierId" defaultValue="" label="Supplier">
              <option value="">No supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </FloatSelect>
            <FloatSelect name="status" defaultValue="draft" label="Status">
              {purchaseOrderStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <details className="admin-advanced">
              <summary>Advanced PO fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="subtotal" type="number" min="0" step="0.01" label="Subtotal" />
                  <FloatInput name="total" type="number" min="0" step="0.01" label="Total" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="orderedAt" type="datetime-local" label="Ordered at" />
                  <FloatInput name="receivedAt" type="datetime-local" label="Received at" />
                </div>
                <FloatTextarea name="notes" rows={2} label="Notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
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
                    {formatStatusLabel(order.status)} | {order.total} EUR
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Parts Inventory</h2>
          <form
            action={upsertInventoryItemAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/inventory" />
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="sku" required label="SKU" />
              <FloatInput name="name" required label="Item name" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="itemType" defaultValue="part" label="Item type">
                {inventoryItemTypes.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <FloatInput name="quantityOnHand" type="number" min="0" step="1" label="Qty on hand" />
              <FloatInput name="reorderLevel" type="number" min="0" step="1" label="Reorder level" />
            </div>
            <details className="admin-advanced">
              <summary>Advanced inventory fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <FloatInput name="brand" label="Brand" />
                  <FloatInput name="model" label="Model" />
                  <FloatInput name="caliber" label="Caliber" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <FloatInput name="location" label="Location" />
                  <FloatInput name="unitCost" type="number" min="0" step="0.01" label="Unit cost EUR" />
                  <FloatInput name="unitPrice" type="number" min="0" step="0.01" label="Unit price EUR" />
                </div>
                <FloatTextarea name="notes" rows={2} label="Notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
            >
              Save Part Item
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {inventoryItems.length === 0 ? (
              <li className="text-graphite/72">No inventory items.</li>
            ) : (
              inventoryItems.slice(0, 20).map((item) => (
                <li key={item.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">
                    {item.sku} - {item.name}
                  </p>
                  <p className="text-xs text-graphite/62">
                    {formatStatusLabel(item.itemType)} | On hand: {item.quantityOnHand} | Reorder:{" "}
                    {item.reorderLevel}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Stock Movements</h2>
          <form
            action={createStockMovementAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/inventory" />
            <FloatInput name="inventoryItemId" label="Inventory item ID" />
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="movementType" defaultValue="manual_adjustment" label="Movement type">
                {stockMovementTypes.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput name="quantityDelta" type="number" required label="+/- qty" />
            </div>
            <details className="admin-advanced">
              <summary>Advanced movement fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <FloatInput name="productId" label="Product ID" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="referenceType" label="Reference type" />
                  <FloatInput name="referenceId" label="Reference ID" />
                </div>
                <FloatInput name="unitCost" type="number" min="0" step="0.01" label="Unit cost EUR" />
                <FloatTextarea name="note" rows={2} label="Notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-walnut w-full sm:w-auto"
            >
              Add Movement
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {stockMovements.length === 0 ? (
              <li className="text-graphite/72">No stock movements.</li>
            ) : (
              stockMovements.slice(0, 20).map((movement) => (
                <li key={movement.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">
                    {formatStatusLabel(movement.movementType)}: {movement.quantityDelta}
                  </p>
                  <p className="text-xs text-graphite/62">
                    Product: {movement.productId ?? "-"} | Item: {movement.inventoryItemId ?? "-"}
                  </p>
                  <p className="text-xs text-graphite/62">
                    {movement.referenceType ?? "-"} | {movement.referenceId ?? "-"}
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
