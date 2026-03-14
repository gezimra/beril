import {
  upsertInventoryCompatibilityAction,
  upsertWatchBrandAction,
  upsertWatchCaliberAction,
  upsertWatchModelAction,
  upsertWatchReferenceAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminInventoryCompatibility,
  listAdminInventoryItems,
  listAdminWatchBrands,
  listAdminWatchCalibers,
  listAdminWatchModels,
  listAdminWatchReferences,
} from "@/lib/db/inventory-ops";

type AdminWatchDbPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminWatchDbPage({ searchParams }: AdminWatchDbPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));

  const [
    watchBrands,
    watchCalibers,
    watchModels,
    watchReferences,
    inventoryItems,
    compatibilityRows,
  ] = await Promise.all([
    listAdminWatchBrands({ search, page }),
    listAdminWatchCalibers({ search, page }),
    listAdminWatchModels({ search, page }),
    listAdminWatchReferences({ search, page }),
    listAdminInventoryItems({ search, page }),
    listAdminInventoryCompatibility({ search, page }),
  ]);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Watch DB</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Watch Models and Compatibility</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Keep your own watch knowledge base for faster diagnostics and part matching.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <FloatInput name="search" defaultValue={search} label="Search by brand, caliber, model, reference" />
        <button
          type="submit"
          className={buttonVariants({ variant: "primary", size: "adminMd" })}
        >
          Apply
        </button>
      </form>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Watch Brands and Calibers</h2>
          <form
            action={upsertWatchBrandAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/watch-db" />
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Add brand</p>
            <FloatInput name="name" required label="Brand name" />
            <details className="admin-advanced">
              <summary>Advanced brand fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <FloatInput name="country" label="Country" />
                <FloatInput name="website" type="url" label="Website" />
                <FloatTextarea name="notes" rows={2} label="Notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
            >
              Save Brand
            </button>
          </form>

          <form
            action={upsertWatchCaliberAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/watch-db" />
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Add caliber</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="brandId" defaultValue="" label="Brand">
                <option value="">No brand</option>
                {watchBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput name="caliberName" required label="Caliber code" />
            </div>
            <FloatInput name="movementType" required label="Movement type" />
            <details className="admin-advanced">
              <summary>Advanced caliber fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <FloatInput name="powerReserveHours" type="number" min="0" step="0.01" label="Power reserve h" />
                  <FloatInput name="frequencyBph" type="number" min="0" step="1" label="Frequency BPH" />
                  <FloatInput name="jewels" type="number" min="0" step="1" label="Jewels" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="diameterMm" type="number" min="0" step="0.01" label="Diameter mm" />
                  <FloatInput name="heightMm" type="number" min="0" step="0.01" label="Height mm" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm text-graphite/74">
                    <input type="checkbox" name="hasHacking" />
                    Hacking seconds
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm text-graphite/74">
                    <input type="checkbox" name="hasHandWinding" />
                    Hand winding
                  </label>
                </div>
                <FloatTextarea name="notes" rows={2} label="Caliber notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-walnut w-full sm:w-auto"
            >
              Save Caliber
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {watchCalibers.length === 0 ? (
              <li className="text-graphite/72">No calibers yet.</li>
            ) : (
              watchCalibers.slice(0, 10).map((caliber) => (
                <li key={caliber.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">
                    {caliber.caliberName} - {caliber.movementType}
                  </p>
                  <p className="text-xs text-graphite/62">
                    PR: {caliber.powerReserveHours ?? "-"}h | BPH: {caliber.frequencyBph ?? "-"} | Jewels:{" "}
                    {caliber.jewels ?? "-"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Watch Models and References</h2>
          <form
            action={upsertWatchModelAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/watch-db" />
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Add model</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="brandId" defaultValue="" label="Brand">
                <option value="">No brand</option>
                {watchBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput name="modelName" required label="Model name" />
            </div>
            <details className="admin-advanced">
              <summary>Advanced model fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="collection" label="Collection" />
                  <FloatInput name="targetGender" label="Target gender" />
                </div>
                <FloatTextarea name="notes" rows={2} label="Model notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
            >
              Save Model
            </button>
          </form>

          <form
            action={upsertWatchReferenceAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/watch-db" />
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Add reference</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="modelId" defaultValue="" label="Model">
                <option value="">Select model</option>
                {watchModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput name="referenceCode" required label="Reference code" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect name="caliberId" defaultValue="" label="Caliber">
                <option value="">No caliber</option>
                {watchCalibers.map((caliber) => (
                  <option key={caliber.id} value={caliber.id}>
                    {caliber.caliberName}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput name="dialColor" label="Dial color" />
            </div>
            <details className="admin-advanced">
              <summary>Advanced reference fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <FloatInput name="caseSizeMm" type="number" min="0" step="0.01" label="Case mm" />
                  <FloatInput name="lugWidthMm" type="number" min="0" step="0.01" label="Lug mm" />
                  <FloatInput name="waterResistanceM" type="number" min="0" step="1" label="Water m" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="caseMaterial" label="Case material" />
                  <FloatInput name="strapType" label="Strap type" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput
                    name="productionFromYear"
                    type="number"
                    min="1900"
                    max="2200"
                    step="1"
                    label="From year"
                  />
                  <FloatInput
                    name="productionToYear"
                    type="number"
                    min="1900"
                    max="2200"
                    step="1"
                    label="To year"
                  />
                </div>
                <FloatInput name="crystal" label="Crystal" />
                <FloatTextarea name="notes" rows={2} label="Reference notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-walnut w-full sm:w-auto"
            >
              Save Reference
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {watchReferences.length === 0 ? (
              <li className="text-graphite/72">No references yet.</li>
            ) : (
              watchReferences.slice(0, 10).map((reference) => (
                <li key={reference.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{reference.referenceCode}</p>
                  <p className="text-xs text-graphite/62">
                    Case {reference.caseSizeMm ?? "-"}mm | WR {reference.waterResistanceM ?? "-"}m |{" "}
                    {reference.dialColor ?? "-"}
                  </p>
                </li>
              ))
            )}
          </ul>

          <form
            action={upsertInventoryCompatibilityAction}
            className="mt-4 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/watch-db" />
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
              Link part compatibility
            </p>
            <FloatSelect name="inventoryItemId" defaultValue="" label="Inventory item">
              <option value="">Select item</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.name}
                </option>
              ))}
            </FloatSelect>
            <div className="grid gap-2 sm:grid-cols-3">
              <FloatSelect name="caliberId" defaultValue="" label="Caliber (optional)">
                <option value="">None</option>
                {watchCalibers.map((caliber) => (
                  <option key={caliber.id} value={caliber.id}>
                    {caliber.caliberName}
                  </option>
                ))}
              </FloatSelect>
              <FloatSelect name="modelId" defaultValue="" label="Model (optional)">
                <option value="">None</option>
                {watchModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName}
                  </option>
                ))}
              </FloatSelect>
              <FloatSelect name="referenceId" defaultValue="" label="Reference (optional)">
                <option value="">None</option>
                {watchReferences.map((reference) => (
                  <option key={reference.id} value={reference.id}>
                    {reference.referenceCode}
                  </option>
                ))}
              </FloatSelect>
            </div>
            <details className="admin-advanced">
              <summary>Advanced compatibility fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <FloatTextarea name="notes" rows={2} label="Compatibility notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-mineral w-full sm:w-auto"
            >
              Save Compatibility Link
            </button>
          </form>

          <ul className="mt-3 space-y-2 text-sm">
            {compatibilityRows.length === 0 ? (
              <li className="text-graphite/72">No compatibility links yet.</li>
            ) : (
              compatibilityRows.slice(0, 12).map((row) => (
                <li key={row.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">Item: {row.inventoryItemId}</p>
                  <p className="text-xs text-graphite/62">
                    Caliber: {row.caliberId ?? "-"} | Model: {row.modelId ?? "-"} | Ref:{" "}
                    {row.referenceId ?? "-"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <Pagination
        page={page}
        hasMore={watchReferences.length === 40 || watchBrands.length === 40 || watchCalibers.length === 40 || watchModels.length === 40}
        searchParams={{ search: search || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
