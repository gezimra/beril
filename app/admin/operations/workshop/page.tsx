import {
  createRepairPartUsageAction,
  upsertWorkOrderAction,
} from "@/app/admin/actions";
import { RepairPartUsageField } from "@/components/admin/repair-part-usage-field";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminInventoryCompatibility,
  listAdminInventoryItems,
  listAdminRepairPartUsage,
  listAdminWatchCalibers,
  listAdminWatchModels,
  listAdminWatchReferences,
  listAdminWorkOrders,
} from "@/lib/db/inventory-ops";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { workOrderStatuses } from "@/types/domain";

type AdminWorkshopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminWorkshopPage({ searchParams }: AdminWorkshopPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const compatCaliberId = getQueryParam(query.compatCaliberId);
  const compatModelId = getQueryParam(query.compatModelId);
  const compatReferenceId = getQueryParam(query.compatReferenceId);
  const suggestedInventoryItemId = getQueryParam(query.suggestInventoryItemId);

  const [
    workOrders,
    inventoryItems,
    watchCalibers,
    watchModels,
    watchReferences,
    compatibilityRows,
    repairPartUsageRows,
  ] = await Promise.all([
    listAdminWorkOrders({ search, status }),
    listAdminInventoryItems({ search }),
    listAdminWatchCalibers({ search }),
    listAdminWatchModels({ search }),
    listAdminWatchReferences({ search }),
    listAdminInventoryCompatibility({ search }),
    listAdminRepairPartUsage({ search }),
  ]);

  const hasCompatibilityFilter = Boolean(compatCaliberId || compatModelId || compatReferenceId);
  const compatibilityScoreByInventoryItem = new Map<string, number>();

  if (hasCompatibilityFilter) {
    for (const row of compatibilityRows) {
      let score = 0;

      if (compatReferenceId && row.referenceId === compatReferenceId) {
        score += 4;
      }
      if (compatModelId && row.modelId === compatModelId) {
        score += 2;
      }
      if (compatCaliberId && row.caliberId === compatCaliberId) {
        score += 1;
      }
      if (score === 0) {
        continue;
      }

      const previous = compatibilityScoreByInventoryItem.get(row.inventoryItemId) ?? 0;
      if (score > previous) {
        compatibilityScoreByInventoryItem.set(row.inventoryItemId, score);
      }
    }
  }

  const suggestedInventoryItems = inventoryItems
    .filter((item) => compatibilityScoreByInventoryItem.has(item.id))
    .sort((a, b) => {
      const scoreDiff =
        (compatibilityScoreByInventoryItem.get(b.id) ?? 0) -
        (compatibilityScoreByInventoryItem.get(a.id) ?? 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return b.quantityOnHand - a.quantityOnHand;
    });

  const validSuggestedInventoryItemId = inventoryItems.some(
    (item) => item.id === suggestedInventoryItemId,
  )
    ? suggestedInventoryItemId
    : "";
  const defaultConsumeInventoryItemId =
    validSuggestedInventoryItemId || suggestedInventoryItems[0]?.id || "";

  const buildWorkshopHref = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (search) {
      params.set("search", search);
    }
    if (status) {
      params.set("status", status);
    }
    if (compatCaliberId) {
      params.set("compatCaliberId", compatCaliberId);
    }
    if (compatModelId) {
      params.set("compatModelId", compatModelId);
    }
    if (compatReferenceId) {
      params.set("compatReferenceId", compatReferenceId);
    }

    for (const [key, value] of Object.entries(extra)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const qs = params.toString();
    return `/admin/operations/workshop${qs ? `?${qs}` : ""}`;
  };

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Workshop</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Repair Work Orders</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Manage repair work orders, part matching, and parts usage consumption.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <FloatInput name="search" defaultValue={search} label="Search by repair ID, notes" />
        <FloatSelect name="status" defaultValue={status} label="Work order status">
          <option value="">All statuses</option>
          {workOrderStatuses.map((item) => (
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
          <h2 className="text-2xl text-graphite">Repair Work Orders</h2>
          <form
            action={upsertWorkOrderAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/workshop" />
            <FloatInput name="repairRequestId" required label="Repair request ID" />
            <FloatSelect name="status" defaultValue="pending" label="Status">
              {workOrderStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>

            <details className="admin-advanced">
              <summary>Advanced work order fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <FloatTextarea name="diagnosis" rows={2} label="Diagnosis" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput
                    name="estimateAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    label="Estimate EUR"
                  />
                  <label className="flex items-center gap-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm text-graphite/74">
                    <input type="checkbox" name="approvedByCustomer" />
                    Approved by customer
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="startedAt" type="datetime-local" label="Started at" />
                  <FloatInput name="completedAt" type="datetime-local" label="Completed at" />
                </div>
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
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
                    {formatStatusLabel(workOrder.status)} | {workOrder.estimateAmount ?? 0} EUR
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Compatibility Finder</h2>

          <form method="get" className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input type="hidden" name="search" value={search} />
            <input type="hidden" name="status" value={status} />
            <div className="grid gap-2 sm:grid-cols-3">
              <FloatSelect name="compatReferenceId" defaultValue={compatReferenceId} label="Reference">
                <option value="">All references</option>
                {watchReferences.map((reference) => (
                  <option key={reference.id} value={reference.id}>
                    {reference.referenceCode}
                  </option>
                ))}
              </FloatSelect>
              <FloatSelect name="compatModelId" defaultValue={compatModelId} label="Model">
                <option value="">All models</option>
                {watchModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName}
                  </option>
                ))}
              </FloatSelect>
              <FloatSelect name="compatCaliberId" defaultValue={compatCaliberId} label="Caliber">
                <option value="">All calibers</option>
                {watchCalibers.map((caliber) => (
                  <option key={caliber.id} value={caliber.id}>
                    {caliber.caliberName}
                  </option>
                ))}
              </FloatSelect>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="admin-primary-btn-mineral"
              >
                Find Compatible Parts
              </button>
              <a
                href={buildWorkshopHref({
                  compatReferenceId: "",
                  compatModelId: "",
                  compatCaliberId: "",
                  suggestInventoryItemId: "",
                })}
                className="admin-secondary-btn"
              >
                Clear Finder
              </a>
            </div>
          </form>

          {hasCompatibilityFilter ? (
            <div className="mt-3 rounded-lg border border-graphite/12 bg-white/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Suggested Parts</p>
              {suggestedInventoryItems.length === 0 ? (
                <p className="mt-2 text-sm text-graphite/72">
                  No compatible parts found for this combination.
                </p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {suggestedInventoryItems.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-graphite/10 bg-white/85 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-graphite">
                          {item.sku} - {item.name}
                        </p>
                        <p className="text-xs text-graphite/62">
                          On hand: {item.quantityOnHand} | Score:{" "}
                          {compatibilityScoreByInventoryItem.get(item.id) ?? 0}
                        </p>
                      </div>
                      <a
                        href={buildWorkshopHref({
                          suggestInventoryItemId: item.id,
                        })}
                        className="inline-flex h-8 items-center rounded-full border border-graphite/20 bg-white px-3 text-[0.66rem] uppercase tracking-[0.12em] text-graphite"
                      >
                        Use
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <form
            action={createRepairPartUsageAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value={buildWorkshopHref({})} />
            <RepairPartUsageField
              workOrders={workOrders.map((workOrder) => ({
                id: workOrder.id,
                label: `${workOrder.id} - ${formatStatusLabel(workOrder.status)}`,
              }))}
              inventoryItems={inventoryItems.map((item) => ({
                id: item.id,
                label: `${item.sku} - ${item.name} (on hand: ${item.quantityOnHand})`,
                unitCost: item.unitCost ?? null,
              }))}
              defaultWorkOrderId={workOrders[0]?.id ?? ""}
              defaultInventoryItemId={defaultConsumeInventoryItemId}
            />
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {repairPartUsageRows.length === 0 ? (
              <li className="text-graphite/72">No consumed parts logged yet.</li>
            ) : (
              repairPartUsageRows.slice(0, 10).map((usage) => (
                <li key={usage.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">
                    {usage.partName} x {usage.quantity}
                  </p>
                  <p className="text-xs text-graphite/62">
                    Work order: {usage.workOrderId} | Item: {usage.inventoryItemId ?? "-"} | Unit cost:{" "}
                    {usage.unitCost.toFixed(2)} EUR
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
