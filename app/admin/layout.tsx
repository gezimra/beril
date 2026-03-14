import type { ReactNode } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell flex min-h-screen">
      {/* Desktop sidebar — sticky, full height */}
      <aside className="hidden lg:block lg:w-52 lg:shrink-0 lg:border-r lg:border-black/8 lg:bg-white">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-3 py-4">
          <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-graphite/35">
            BERIL Admin
          </p>
          <AdminSidebarNav />
          <div className="mt-auto space-y-0.5 border-t border-black/7 pt-3">
            <a
              href="/"
              className="block rounded px-2 py-1.5 text-[0.8rem] text-graphite/72 transition hover:bg-black/[0.04] hover:text-graphite"
            >
              View Shop →
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="block w-full rounded px-2 py-1.5 text-left text-[0.8rem] text-graphite/72 transition hover:bg-black/[0.04] hover:text-graphite"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
          {children}
        </main>

        {/* Mobile sidebar — below content */}
        <div className="border-t border-black/8 bg-white p-3 sm:p-4 lg:hidden">
          <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-graphite/35">
            BERIL Admin
          </p>
          <AdminSidebarNav />
          <div className="mt-4 flex gap-2">
            <a
              href="/"
              className="rounded border border-black/10 px-3 py-1.5 text-xs text-graphite/72 transition hover:bg-black/[0.04] hover:text-graphite"
            >
              View Shop →
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded border border-black/10 px-3 py-1.5 text-xs text-graphite/72 transition hover:bg-black/[0.04] hover:text-graphite"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
