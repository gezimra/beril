import type { ReactNode } from "react";

import { logoutAction } from "@/app/(auth)/actions";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { Container } from "@/components/layout/container";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen overflow-x-clip py-3 sm:py-6 lg:py-8">
      <Container className="grid max-w-[104rem] gap-3 px-3 sm:gap-4 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6 lg:px-10">
        <aside className="surface-panel order-2 h-fit p-3 sm:p-4 lg:order-1 lg:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite/65">BERIL Admin</p>
          <AdminSidebarNav />
          <div className="mt-4 flex flex-col gap-2 sm:mt-5 lg:mt-6">
            <a
              href="/"
              className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/80 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
            >
              View Shop →
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white/80 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <section className="order-1 min-w-0 lg:order-2">{children}</section>
      </Container>
    </main>
  );
}
