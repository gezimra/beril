import {
  uploadRepairAttachmentAction,
  updateRepairEstimateAction,
  updateRepairNotesAction,
  updateRepairStatusAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminRepairs } from "@/lib/db/admin";
import { formatStatusLabel } from "@/lib/utils/status-label";
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

function RepairEditForms({ repair }: { repair: Awaited<ReturnType<typeof listAdminRepairs>>[number] }) {
  return (
    <details>
      <summary className="cursor-pointer text-xs uppercase tracking-[0.12em] text-graphite/45 hover:text-graphite/70 select-none py-1">
        Edit
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <form action={updateRepairStatusAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
          <input type="hidden" name="repairId" value={repair.id} />
          <FloatSelect label="Status update" name="status" defaultValue={repair.status}>
            {repairStatuses.map((item) => (
              <option key={item} value={item}>{formatStatusLabel(item)}</option>
            ))}
          </FloatSelect>
          <FloatInput label="Status note" name="note" />
          <label className="flex items-center gap-2 text-xs text-graphite/72">
            <input type="checkbox" name="visibleToCustomer" value="true" />
            visible to customer
          </label>
          <button type="submit" className={buttonVariants({ variant: "mineral", size: "adminSm" })}>
            Save Status
          </button>
        </form>

        <form action={updateRepairNotesAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
          <input type="hidden" name="repairId" value={repair.id} />
          <FloatTextarea label="Internal notes" name="internalNotes" rows={2} defaultValue={repair.notesInternal ?? ""} />
          <FloatTextarea label="Customer-visible notes" name="customerNotes" rows={2} defaultValue={repair.notesCustomer ?? ""} />
          <button type="submit" className={buttonVariants({ variant: "secondary", size: "adminSm" })}>
            Save Notes
          </button>
        </form>

        <div className="space-y-3">
          <form action={updateRepairEstimateAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input type="hidden" name="repairId" value={repair.id} />
            <FloatInput label="Estimated completion" type="date" name="estimatedCompletion" defaultValue={repair.estimatedCompletion ?? ""} />
            <FloatInput label="Amount due" type="number" name="amountDue" step="0.01" defaultValue={repair.amountDue ?? ""} />
            <button type="submit" className={buttonVariants({ variant: "secondary", size: "adminSm" })}>
              Save Estimate
            </button>
          </form>

          <form action={uploadRepairAttachmentAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
            <input type="hidden" name="repairId" value={repair.id} />
            <FloatInput label="Attachment label (optional)" name="fileLabel" />
            <input
              type="file"
              name="attachment"
              accept="image/*,.pdf"
              required
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
            />
            <p className="text-xs text-graphite/62">Max 8MB</p>
            <button type="submit" className={buttonVariants({ variant: "secondary", size: "adminSm" })}>
              Upload
            </button>
          </form>

          {repair.attachments.length > 0 && (
            <div className="rounded-lg border border-graphite/12 bg-white/70 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">Attachments</p>
              <ul className="mt-2 space-y-1">
                {repair.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-graphite underline">
                      {a.fileLabel ?? "Attachment"}
                    </a>
                    <span className="ml-1 text-xs text-graphite/45">{a.fileType}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

export default async function AdminRepairsPage({
  searchParams,
}: AdminRepairsPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));
  const repairs = await listAdminRepairs({ search, status, page });

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
        <FloatInput label="Search" name="search" defaultValue={search} />
        <FloatSelect label="Status" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {repairStatuses.map((item) => (
            <option key={item} value={item}>{formatStatusLabel(item)}</option>
          ))}
        </FloatSelect>
        <button type="submit" className={buttonVariants({ variant: "primary", size: "adminMd" })}>
          Apply
        </button>
      </form>

      {repairs.length === 0 ? (
        <div className="surface-panel p-6 text-sm text-graphite/75">No repair requests found for current filters.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {repairs.map((repair) => (
              <div key={repair.id} className="surface-panel p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-graphite/55">{repair.repairCode}</p>
                    <p className="mt-0.5 font-medium text-graphite">{repair.customerName}</p>
                    <p className="text-xs text-graphite/55">{new Date(repair.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge tone="premium">{formatStatusLabel(repair.status)}</StatusBadge>
                </div>
                <p className="text-xs text-graphite/65">
                  {repair.brand} {repair.model} · {repair.itemType}
                </p>
                <p className="text-xs text-graphite/65">{repair.serviceType}</p>
                <div className="flex items-center justify-between text-xs text-graphite/65">
                  {repair.estimatedCompletion && (
                    <span>Est: {new Date(repair.estimatedCompletion).toLocaleDateString()}</span>
                  )}
                  {repair.amountDue != null && <span>€{repair.amountDue.toFixed(2)}</span>}
                </div>
                <RepairEditForms repair={repair} />
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
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Service</th>
                  <th className="px-2 py-2">Est. completion</th>
                  <th className="px-2 py-2">Amount due</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((repair) => (
                  <>
                    <tr key={repair.id} className="border-t border-graphite/10">
                      <td className="px-2 py-3 font-medium text-graphite">{repair.repairCode}</td>
                      <td className="px-2 py-3 text-graphite/65 whitespace-nowrap">
                        {new Date(repair.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-3 text-graphite">
                        <div>{repair.customerName}</div>
                        <div className="text-xs text-graphite/55">{repair.phone}</div>
                      </td>
                      <td className="px-2 py-3 text-graphite/65 text-xs">
                        <div>{repair.brand} {repair.model}</div>
                        <div className="text-graphite/45">{repair.itemType}</div>
                      </td>
                      <td className="px-2 py-3 text-graphite/65 text-xs max-w-[10rem]">{repair.serviceType}</td>
                      <td className="px-2 py-3 text-graphite/65 whitespace-nowrap text-xs">
                        {repair.estimatedCompletion
                          ? new Date(repair.estimatedCompletion).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-2 py-3 text-graphite whitespace-nowrap">
                        {repair.amountDue != null ? `€${repair.amountDue.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge tone="premium">{formatStatusLabel(repair.status)}</StatusBadge>
                      </td>
                    </tr>
                    <tr key={`${repair.id}-edit`} className="border-b border-graphite/8">
                      <td colSpan={8} className="px-2 pb-3">
                        <RepairEditForms repair={repair} />
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
        hasMore={repairs.length === 20}
        searchParams={{ search: search || undefined, status: status || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
