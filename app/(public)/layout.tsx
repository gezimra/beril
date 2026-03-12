import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LiveChatWidget } from "@/components/support/live-chat-widget";
import { getCatalogFilterOptions } from "@/lib/db/catalog";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";
import { getServerLocale } from "@/lib/i18n/server";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [locale, customerUser, watchFilters, eyewearFilters] = await Promise.all([
    getServerLocale(),
    getAuthenticatedCustomerUser(),
    getCatalogFilterOptions("watch"),
    getCatalogFilterOptions("eyewear"),
  ]);

  return (
    <>
      <Header
        customerUser={customerUser}
        watchBrands={watchFilters.brands}
        eyewearBrands={eyewearFilters.brands}
        locale={locale}
      />
      <main id="main-content" className="min-h-[calc(100vh-12rem)]">
        {children}
      </main>
      <Footer />
      <LiveChatWidget />
    </>
  );
}
