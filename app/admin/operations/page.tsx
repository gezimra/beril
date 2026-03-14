import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminInventoryItems,
  listAdminPurchaseOrders,
  listAdminWorkOrders,
} from "@/lib/db/inventory-ops";
export default async function AdminOperationsPage() {
  const [purchaseOrders, workOrders, inventoryItems] = await Promise.all([
    listAdminPurchaseOrders(),
    listAdminWorkOrders(),
    listAdminInventoryItems(),
  ]);

  const draftPurchaseOrders = purchaseOrders.filter((order) => order.status === "draft").length;
  const openWorkOrders = workOrders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled",
  ).length;
  const lowStockItems = inventoryItems.filter(
    (item) => item.active && item.quantityOnHand <= item.reorderLevel,
  ).length;

  const workflowCards = [
    {
      title: "Front Desk",
      description: "Fast intake for new in-store sales and service requests.",
      href: "/admin/operations/front-desk",
      cta: "Open Front Desk",
    },
    {
      title: "Workshop",
      description: "Manage work orders, compatible parts, and repair part usage.",
      href: "/admin/operations/workshop",
      cta: "Open Workshop",
    },
    {
      title: "Inventory",
      description: "Suppliers, purchase orders, stock movements, and parts inventory.",
      href: "/admin/operations/inventory",
      cta: "Open Inventory",
    },
    {
      title: "Watch Database",
      description: "Manage brands, calibers, models, references, and part compatibility.",
      href: "/admin/operations/watch-db",
      cta: "Open Watch DB",
    },
    {
      title: "Cashbook",
      description: "Record daily inflow/outflow and keep a clean daily balance.",
      href: "/admin/operations/cashbook",
      cta: "Open Cashbook",
    },
  ];

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Operations</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Operations Workspace</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Use focused modules so staff can finish tasks quickly without scrolling through one long page.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Draft POs</p>
          <p className="mt-2 text-3xl text-graphite">{draftPurchaseOrders}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Open Work Orders</p>
          <p className="mt-2 text-3xl text-graphite">{openWorkOrders}</p>
        </article>
        <article className="surface-panel p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Low Stock Items</p>
          <p className="mt-2 text-3xl text-graphite">{lowStockItems}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {workflowCards.map((card) => (
          <article key={card.href} className="surface-panel flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-2xl text-graphite">{card.title}</h2>
              <p className="mt-1 text-sm text-graphite/70">{card.description}</p>
            </div>
            <Link
              href={card.href}
              className={buttonVariants({ variant: "secondary", size: "adminSm", className: "w-fit" })}
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="surface-panel p-5">
        <h2 className="text-2xl text-graphite">Common Admin Pages</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Orders", href: "/admin/orders" },
            { label: "Repairs", href: "/admin/repairs" },
            { label: "Products", href: "/admin/products" },
            { label: "Customers", href: "/admin/customers" },
            { label: "Support", href: "/admin/support" },
            { label: "Marketing", href: "/admin/marketing" },
            { label: "Growth", href: "/admin/growth" },
            { label: "Settings", href: "/admin/settings" },
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
