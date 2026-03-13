import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { getCatalogFilterOptions } from "@/lib/db/catalog";
import { checkIsAdminUser } from "@/lib/admin-auth";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";
import { getServerLocale } from "@/lib/i18n/server";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [locale, customerUser, watchFilters, eyewearFilters] = await Promise.all([
    getServerLocale(),
    getAuthenticatedCustomerUser(),
    getCatalogFilterOptions("watch"),
    getCatalogFilterOptions("eyewear"),
  ]);

  const isAdmin = customerUser ? await checkIsAdminUser(customerUser.id) : false;

  return (
    <>
      <Header
        customerUser={customerUser}
        watchBrands={watchFilters.brands}
        eyewearBrands={eyewearFilters.brands}
        locale={locale}
        isAdmin={isAdmin}
      />
      <main id="main-content" className="min-h-[calc(100vh-12rem)] pt-24">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
