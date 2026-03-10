import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminCustomers } from "@/lib/db/admin";

type AdminCustomersPageProps = {
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

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const customers = await listAdminCustomers({ search });

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Customers</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Customer Overview</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Derived customer view from orders, repairs, and contact inquiries.
        </p>
      </header>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, email, phone"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Apply
        </button>
      </form>

      <div className="surface-panel overflow-x-auto p-4">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-graphite/62">
            <tr>
              <th className="px-2 py-2">Customer</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">Orders</th>
              <th className="px-2 py-2">Repairs</th>
              <th className="px-2 py-2">Contacts</th>
              <th className="px-2 py-2">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-5 text-graphite/72">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.key} className="border-t border-graphite/10">
                  <td className="px-2 py-3 font-medium text-graphite">{customer.name}</td>
                  <td className="px-2 py-3 text-graphite/75">{customer.email ?? "-"}</td>
                  <td className="px-2 py-3 text-graphite/75">{customer.phone ?? "-"}</td>
                  <td className="px-2 py-3 text-graphite/75">{customer.orderCount}</td>
                  <td className="px-2 py-3 text-graphite/75">{customer.repairCount}</td>
                  <td className="px-2 py-3 text-graphite/75">{customer.contactCount}</td>
                  <td className="px-2 py-3 text-graphite/75">
                    {new Date(customer.lastActivityAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
