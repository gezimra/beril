import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  FrontDeskOrderCards,
  FrontDeskRepairCards,
} from "@/components/admin/front-desk-recent-cards";
import {
  listAdminContacts,
  listAdminOrders,
  listAdminProducts,
  listAdminRepairs,
} from "@/lib/db/admin";

export default async function AdminHomePage() {
  // Single fetch pass — no duplicate DB calls
  const [orders, repairs, products, contacts] = await Promise.all([
    listAdminOrders(),
    listAdminRepairs(),
    listAdminProducts(),
    listAdminContacts(),
  ]);

  const stats = {
    pendingOrders: orders.filter((o) => o.orderStatus === "pending").length,
    newRepairs: repairs.filter((r) =>
      ["request_received", "awaiting_drop_off"].includes(r.status),
    ).length,
    lowStock: products.filter(
      (p) => p.stockStatus === "limited" || (p.quantity !== null && p.quantity <= 2),
    ).length,
    contactInquiries: contacts.length,
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today)).length;
  const todayRepairs = repairs.filter((r) => r.createdAt.startsWith(today)).length;
  const recentContacts = contacts.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-graphite">Dashboard</h1>
        <Link href="/admin/operations/front-desk" className="admin-primary-btn-mineral">
          + New Intake
        </Link>
      </div>

      {/* Stat cards — each is a link to the relevant filtered view */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          href="/admin/orders"
          highlight={stats.pendingOrders > 0}
          highlightColor="walnut"
        />
        <StatCard
          label="New Repairs"
          value={stats.newRepairs}
          href="/admin/repairs"
          highlight={stats.newRepairs > 0}
          highlightColor="mineral"
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStock}
          href="/admin/operations/inventory"
          highlight={stats.lowStock > 0}
          highlightColor="gold"
        />
        <StatCard
          label="Contact Inquiries"
          value={stats.contactInquiries}
          href="/admin/support"
          highlight={false}
          highlightColor="mineral"
        />
      </div>

      {/* Recent orders + repairs (clickable rows → modal) */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-black/7 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-graphite">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-graphite/40 transition hover:text-graphite"
            >
              View all →
            </Link>
          </div>
          <div className="p-3">
            <FrontDeskOrderCards orders={orders} todayCount={todayOrders} />
          </div>
        </div>

        <div className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-black/7 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-graphite">Recent Repairs</h2>
            <Link
              href="/admin/repairs"
              className="text-xs text-graphite/40 transition hover:text-graphite"
            >
              View all →
            </Link>
          </div>
          <div className="p-3">
            <FrontDeskRepairCards repairs={repairs} todayCount={todayRepairs} />
          </div>
        </div>
      </div>

      {/* Contact inquiries + Quick access */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-black/7 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-graphite">Contact Inquiries</h2>
            <Link
              href="/admin/support"
              className="text-xs text-graphite/40 transition hover:text-graphite"
            >
              View inbox →
            </Link>
          </div>
          <div className="p-3">
            {recentContacts.length === 0 ? (
              <p className="py-2 text-xs text-graphite/42">No contact inquiries yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {recentContacts.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      href="/admin/support"
                      className="flex items-start justify-between gap-3 rounded border border-black/8 bg-white px-3 py-2 transition hover:bg-black/[0.025]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-graphite">
                          {contact.subject}
                        </p>
                        <p className="truncate text-xs text-graphite/52">
                          {contact.name} · {contact.email}
                        </p>
                      </div>
                      <p className="shrink-0 text-[0.68rem] text-graphite/35">
                        {relativeTime(contact.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick access grid — descriptions make links purposeful */}
        <div className="surface-panel overflow-hidden">
          <div className="border-b border-black/7 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-graphite">Quick Access</h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-black/[0.06]">
            {[
              {
                label: "Front Desk",
                desc: "Intake orders & repairs",
                href: "/admin/operations/front-desk",
              },
              {
                label: "Workshop",
                desc: "Active repair jobs",
                href: "/admin/operations/workshop",
              },
              {
                label: "Inventory",
                desc: "Stock & movements",
                href: "/admin/operations/inventory",
              },
              {
                label: "Watch DB",
                desc: "Reference database",
                href: "/admin/operations/watch-db",
              },
              {
                label: "Cashbook",
                desc: "Daily transactions",
                href: "/admin/operations/cashbook",
              },
              {
                label: "Products",
                desc: "Catalog management",
                href: "/admin/products",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-0.5 bg-white px-4 py-3 transition hover:bg-black/[0.025]"
              >
                <p className="text-sm font-medium text-graphite">{item.label}</p>
                <p className="text-xs text-graphite/45">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  href,
  highlight,
  highlightColor,
}: {
  label: string;
  value: number;
  href: string;
  highlight: boolean;
  highlightColor: "walnut" | "mineral" | "gold";
}) {
  const valueClass = highlight
    ? highlightColor === "walnut"
      ? "text-walnut"
      : highlightColor === "mineral"
        ? "text-mineral"
        : "text-[#9a7240]"
    : "text-graphite";

  return (
    <Link
      href={href}
      className="surface-panel flex items-start justify-between gap-3 p-4 transition hover:shadow-md"
    >
      <div>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-graphite/40">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      </div>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-graphite/22" />
    </Link>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
