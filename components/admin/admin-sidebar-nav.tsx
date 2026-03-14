"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AdminNavItem = {
  label: string;
  href: string;
  exact?: boolean;
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
    label: "Inventory",
    items: [
      { label: "Operations Hub", href: "/admin/operations", exact: true },
      { label: "Inventory", href: "/admin/operations/inventory" },
      { label: "Watch DB", href: "/admin/operations/watch-db" },
      { label: "Products", href: "/admin/products" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers" },
      { label: "Support", href: "/admin/support" },
      { label: "Payments", href: "/admin/payments" },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Marketing", href: "/admin/marketing" },
      { label: "Growth", href: "/admin/growth" },
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

function isActive(pathname: string, item: AdminNavItem) {
  if (item.exact || item.href === "/admin") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
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

  const groups = hasFilter ? filteredGroups : adminNavGroups;

  return (
    <div className="mt-3 sm:mt-4">
      <label htmlFor="admin-nav-filter" className="sr-only">
        Filter admin navigation
      </label>
      <input
        id="admin-nav-filter"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Quick jump..."
        className="mb-3 h-7 w-full rounded border border-black/10 bg-black/[0.03] px-2.5 text-xs text-graphite outline-none transition placeholder:text-graphite/38 focus:border-mineral/40 focus:bg-white"
      />

      <nav className="space-y-3.5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[0.59rem] font-semibold uppercase tracking-[0.16em] text-graphite/50">
              {group.label}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block rounded px-2 py-1.5 text-[0.8rem] transition",
                        active
                          ? "bg-mineral/[0.09] font-medium text-mineral"
                          : "text-graphite/80 hover:bg-black/[0.04] hover:text-graphite",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
