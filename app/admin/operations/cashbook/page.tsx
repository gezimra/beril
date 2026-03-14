import { createCashbookEntryAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminCashbookEntries } from "@/lib/db/inventory-ops";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { cashEntryTypes, paymentMethods } from "@/types/domain";

type AdminCashbookPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminCashbookPage({ searchParams }: AdminCashbookPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));
  const entries = await listAdminCashbookEntries({ search, page });

  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((entry) => entry.entryDate === today);
  const todayInflow = todayEntries
    .filter((entry) => entry.entryType === "inflow")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const todayOutflow = todayEntries
    .filter((entry) => entry.entryType === "outflow")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const todayBalance = todayInflow - todayOutflow;

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Cashbook</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Daily Balance</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Track all daily inflows and outflows, including manual store activity.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Today Inflow</p>
          <p className="mt-2 text-3xl text-graphite">{todayInflow.toFixed(2)} EUR</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Today Outflow</p>
          <p className="mt-2 text-3xl text-graphite">{todayOutflow.toFixed(2)} EUR</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Today Balance</p>
          <p className="mt-2 text-3xl text-graphite">{todayBalance.toFixed(2)} EUR</p>
        </article>
      </section>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <FloatInput name="search" defaultValue={search} label="Search by category, note, reference" />
        <button
          type="submit"
          className={buttonVariants({ variant: "primary", size: "adminMd" })}
        >
          Apply
        </button>
      </form>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Add Cash Entry</h2>
          <form
            action={createCashbookEntryAction}
            className="mt-3 space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3"
          >
            <input type="hidden" name="returnTo" value="/admin/operations/cashbook" />
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="entryDate" type="date" defaultValue={today} label="Entry date" />
              <FloatSelect name="entryType" defaultValue="inflow" label="Entry type">
                {cashEntryTypes.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput name="amount" type="number" min="0" step="0.01" required label="Amount EUR" />
              <FloatInput name="category" label="Category" />
            </div>
            <FloatSelect name="paymentMethod" defaultValue="cash_on_delivery" label="Payment method">
              {paymentMethods.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <details className="admin-advanced">
              <summary>Advanced cashbook fields</summary>
              <div className="space-y-2 px-3 pb-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <FloatInput name="referenceType" label="Reference type" />
                  <FloatInput name="referenceId" label="Reference ID" />
                </div>
                <FloatTextarea name="note" rows={2} label="Notes" />
              </div>
            </details>
            <button
              type="submit"
              className="admin-primary-btn-walnut w-full sm:w-auto"
            >
              Add Cash Entry
            </button>
          </form>
        </article>

        <article className="surface-panel p-4">
          <h2 className="text-2xl text-graphite">Recent Entries</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {entries.length === 0 ? (
              <li className="text-graphite/72">No cashbook entries.</li>
            ) : (
              entries.slice(0, 30).map((entry) => (
                <li key={entry.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">
                    {entry.entryDate} | {formatStatusLabel(entry.entryType)} | {entry.amount.toFixed(2)} EUR
                  </p>
                  <p className="text-xs text-graphite/62">
                    {entry.category} | {formatStatusLabel(entry.paymentMethod)}
                  </p>
                  <p className="text-xs text-graphite/62">
                    {entry.referenceType ?? "-"} | {entry.referenceId ?? "-"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <Pagination
        page={page}
        hasMore={entries.length === 40}
        searchParams={{ search: search || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
