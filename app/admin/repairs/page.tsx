import {
  updateRepairEstimateAction,
  updateRepairNotesAction,
  updateRepairStatusAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminRepairs } from "@/lib/db/admin";
import { repairStatuses } from "@/types/domain";

type AdminRepairsPageProps = {
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

export default async function AdminRepairsPage({
  searchParams,
}: AdminRepairsPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const repairs = await listAdminRepairs({ search, status });

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Repairs</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Repairs Management</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Track repair tickets, update statuses, and manage customer-visible notes.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search repair code, customer, brand, model"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {repairStatuses.map((item) => (
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

      <div className="space-y-4">
        {repairs.length === 0 ? (
          <div className="surface-panel p-6 text-sm text-graphite/75">
            No repair requests found for current filters.
          </div>
        ) : (
          repairs.map((repair) => (
            <article key={repair.id} className="surface-panel space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
                    {repair.repairCode}
                  </p>
                  <h2 className="mt-1 text-2xl text-graphite">
                    {repair.customerName}
                  </h2>
                  <p className="mt-1 text-sm text-graphite/72">
                    {repair.itemType} | {repair.brand} {repair.model}
                  </p>
                </div>
                <StatusBadge tone="premium">{repair.status}</StatusBadge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <form
                  action={updateRepairStatusAction}
                  className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
                >
                  <input type="hidden" name="repairId" value={repair.id} />
                  <label className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                    Status update
                  </label>
                  <select
                    name="status"
                    defaultValue={repair.status}
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  >
                    {repairStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    name="note"
                    placeholder="Status note"
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs text-graphite/72">
                    <input type="checkbox" name="visibleToCustomer" value="true" />
                    visible to customer
                  </label>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
                  >
                    Save Status
                  </button>
                </form>

                <form
                  action={updateRepairNotesAction}
                  className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
                >
                  <input type="hidden" name="repairId" value={repair.id} />
                  <label className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                    Notes
                  </label>
                  <textarea
                    name="internalNotes"
                    rows={2}
                    defaultValue={repair.notesInternal ?? ""}
                    placeholder="Internal notes"
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="customerNotes"
                    rows={2}
                    defaultValue={repair.notesCustomer ?? ""}
                    placeholder="Customer-visible notes"
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                  >
                    Save Notes
                  </button>
                </form>

                <form
                  action={updateRepairEstimateAction}
                  className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
                >
                  <input type="hidden" name="repairId" value={repair.id} />
                  <label className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                    Estimate
                  </label>
                  <input
                    type="date"
                    name="estimatedCompletion"
                    defaultValue={repair.estimatedCompletion ?? ""}
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    name="amountDue"
                    step="0.01"
                    defaultValue={repair.amountDue ?? ""}
                    placeholder="Amount due"
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                  >
                    Save Estimate
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
