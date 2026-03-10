import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LiveChatWidget } from "@/components/support/live-chat-widget";
import { getAuthenticatedCustomerUser } from "@/lib/db/customer-account";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const customerUser = await getAuthenticatedCustomerUser();

  return (
    <>
      <Header customerUser={customerUser} />
      <main id="main-content" className="min-h-[calc(100vh-12rem)]">
        {children}
      </main>
      <Footer />
      <LiveChatWidget />
    </>
  );
}
