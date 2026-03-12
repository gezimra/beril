import Link from "next/link";

import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminDashboardStats, getRecentDashboardData } from "@/lib/db/admin";

export default async function AdminHomePage() {
  const [stats, recent] = await Promise.all([
    getAdminDashboardStats(),
    getRecentDashboardData(),
  ]);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Admin Dashboard</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Operations Overview</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Monitor orders, repairs, stock risk, and inbound customer inquiries.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
            Pending orders
          </p>
          <p className="mt-2 text-3xl text-graphite">{stats.pendingOrders}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
            New repairs
          </p>
          <p className="mt-2 text-3xl text-graphite">{stats.newRepairs}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
            Low stock alerts
          </p>
          <p className="mt-2 text-3xl text-graphite">{stats.lowStockProducts}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
            Contact inquiries
          </p>
          <p className="mt-2 text-3xl text-graphite">{stats.contactInquiries}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="surface-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-graphite">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs uppercase tracking-[0.12em]">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recent.recentOrders.length === 0 ? (
              <li className="text-graphite/65">No orders yet.</li>
            ) : (
              recent.recentOrders.map((order) => (
                <li key={order.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{order.orderCode}</p>
                  <p className="text-graphite/72">{order.customerName}</p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-graphite">Recent Repairs</h2>
            <Link href="/admin/repairs" className="text-xs uppercase tracking-[0.12em]">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recent.recentRepairs.length === 0 ? (
              <li className="text-graphite/65">No repairs yet.</li>
            ) : (
              recent.recentRepairs.map((repair) => (
                <li key={repair.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{repair.repairCode}</p>
                  <p className="text-graphite/72">{repair.customerName}</p>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="surface-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-graphite">Recent Contacts</h2>
            <Link href="/admin/content" className="text-xs uppercase tracking-[0.12em]">
              View inbox
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recent.recentContacts.length === 0 ? (
              <li className="text-graphite/65">No contact inquiries yet.</li>
            ) : (
              recent.recentContacts.map((contact) => (
                <li key={contact.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                  <p className="font-medium text-graphite">{contact.subject}</p>
                  <p className="text-graphite/72">{contact.name}</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="surface-panel p-5">
        <h2 className="text-2xl text-graphite">Task Modules</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Front Desk", href: "/admin/operations/front-desk" },
            { label: "Workshop", href: "/admin/operations/workshop" },
            { label: "Inventory", href: "/admin/operations/inventory" },
            { label: "Watch DB", href: "/admin/operations/watch-db" },
            { label: "Cashbook", href: "/admin/operations/cashbook" },
            { label: "Support", href: "/admin/support" },
            { label: "Marketing", href: "/admin/marketing" },
            { label: "Growth", href: "/admin/growth" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-graphite/12 bg-white/75 px-4 py-3 text-sm font-medium text-graphite transition hover:bg-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
