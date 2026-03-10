import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-[calc(100vh-12rem)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
