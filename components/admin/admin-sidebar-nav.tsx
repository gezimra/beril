"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AdminNavItem = {
  label: string;
  href: string;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Daily Tasks",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Front Desk", href: "/admin/operations/front-desk" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Repairs", href: "/admin/repairs" },
      { label: "Workshop", href: "/admin/operations/workshop" },
      { label: "Cashbook", href: "/admin/operations/cashbook" },
    ],
  },
  {
    label: "Inventory and Catalog",
    items: [
      { label: "Operations Hub", href: "/admin/operations" },
      { label: "Inventory", href: "/admin/operations/inventory" },
      { label: "Watch DB", href: "/admin/operations/watch-db" },
      { label: "Products", href: "/admin/products" },
    ],
  },
  {
    label: "Customers and Growth",
    items: [
      { label: "Customers", href: "/admin/customers" },
      { label: "Support", href: "/admin/support" },
      { label: "Marketing", href: "/admin/marketing" },
      { label: "Growth", href: "/admin/growth" },
      { label: "Payments", href: "/admin/payments" },
    ],
  },
  {
    label: "Website",
    items: [
      { label: "Content", href: "/admin/content" },
      { label: "Hero Slides", href: "/admin/hero-slides" },
      { label: "Journal", href: "/admin/journal" },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/admin/settings" }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const hasFilter = normalizedQuery.length > 0;

  const filteredGroups = adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(normalizedQuery),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
      <label htmlFor="admin-nav-filter" className="sr-only">
        Filter admin navigation
      </label>
      <input
        id="admin-nav-filter"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Quick jump..."
        className="h-9 w-full rounded-lg border border-graphite/12 bg-white/80 px-3 text-sm text-graphite outline-none transition focus:border-graphite/30"
      />

      <nav className="space-y-1.5 sm:space-y-2">
        {(hasFilter ? filteredGroups : adminNavGroups).map((group) => {
          const groupHasActive = group.items.some((item) => isActive(pathname, item.href));
          return (
            <details
              key={group.label}
              open={groupHasActive || hasFilter}
              className="rounded-lg border border-graphite/10 bg-white/65"
            >
              <summary className="cursor-pointer list-none px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-graphite/64">
                {group.label}
              </summary>
              <ul className="space-y-1 px-2 pb-1.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "block rounded-lg px-3 py-1.5 text-sm transition",
                          active
                            ? "border border-mineral/22 bg-mineral/10 text-mineral"
                            : "text-graphite/82 hover:bg-white/80 hover:text-graphite",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </nav>
    </div>
  );
}
