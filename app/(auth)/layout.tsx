import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen py-16">
      <Container className="max-w-xl">
        <div className="surface-panel p-8 sm:p-10">{children}</div>
      </Container>
    </main>
  );
}
