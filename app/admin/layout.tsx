import type { ReactNode } from "react";
import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { Container } from "@/components/layout/container";

const adminLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Repairs", href: "/admin/repairs" },
  { label: "Products", href: "/admin/products" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Marketing", href: "/admin/marketing" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Support", href: "/admin/support" },
  { label: "Operations", href: "/admin/operations" },
  { label: "Growth", href: "/admin/growth" },
  { label: "Content", href: "/admin/content" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Journal", href: "/admin/journal" },
];

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen py-8">
      <Container className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="surface-panel h-fit p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite/65">BERIL Admin</p>
          <nav className="mt-4 space-y-1">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm text-graphite/82 hover:bg-white/70 hover:text-graphite"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-6">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/80 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
            >
              Sign out
            </button>
          </form>
        </aside>
        <section>{children}</section>
      </Container>
    </main>
  );
}
