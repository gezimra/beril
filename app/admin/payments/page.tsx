import { updatePaymentTransactionStatusAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatInput, FloatSelect } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminPaymentTransactions } from "@/lib/db/payments-promotions";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { paymentTransactionStatuses } from "@/types/domain";

type AdminPaymentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));
  const transactions = await listAdminPaymentTransactions({ search, status, page });

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Payments</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Payment Transactions</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Track online and offline transactions and manually reconcile test statuses.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_14rem_auto]">
        <FloatInput
          label="Search"
          name="search"
          defaultValue={search}
        />
        <FloatSelect
          label="Status"
          name="status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          {paymentTransactionStatuses.map((item) => (
            <option key={item} value={item}>
              {formatStatusLabel(item)}
            </option>
          ))}
        </FloatSelect>
        <button
          type="submit"
          className={buttonVariants({ variant: "primary", size: "adminMd" })}
        >
          Apply
        </button>
      </form>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="surface-panel p-6 text-sm text-graphite/75">
            No payment transactions found.
          </div>
        ) : (
          transactions.map((transaction) => (
            <article key={transaction.id} className="surface-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-graphite/62">
                    {transaction.id}
                  </p>
                  <h2 className="mt-1 text-xl text-graphite">
                    Order: {transaction.orderId}
                  </h2>
                  <p className="text-sm text-graphite/72">
                    {transaction.provider} | {transaction.method} | {transaction.amount}{" "}
                    {transaction.currency}
                  </p>
                  <p className="text-xs text-graphite/62">
                    Reference: {transaction.providerReference ?? "-"}
                  </p>
                </div>
                <StatusBadge tone="premium">{formatStatusLabel(transaction.status)}</StatusBadge>
              </div>

              <form
                action={updatePaymentTransactionStatusAction}
                className="mt-3 grid gap-2 sm:grid-cols-[14rem_1fr_auto]"
              >
                <input type="hidden" name="transactionId" value={transaction.id} />
                <FloatSelect
                  label="Status"
                  name="status"
                  defaultValue={transaction.status}
                >
                  {paymentTransactionStatuses.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
                <FloatInput
                  label="Note"
                  name="note"
                />
                <button
                  type="submit"
                  className={buttonVariants({ variant: "secondary", size: "adminMd" })}
                >
                  Save
                </button>
              </form>
            </article>
          ))
        )}
      </div>

      <Pagination
        page={page}
        hasMore={transactions.length === 30}
        searchParams={{ search: search || undefined, status: status || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
