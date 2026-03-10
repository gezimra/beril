import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie policy for BERIL website.",
  alternates: {
    canonical: "/cookies",
  },
  openGraph: {
    title: "BERIL Cookie Policy",
    description: "Cookie policy and browser data usage for BERIL website.",
    images: [{ url: "/placeholders/product-default.svg" }],
  },
};

export default function CookiesPage() {
  return (
    <SectionWrapper className="py-16">
      <Container className="max-w-4xl space-y-6">
        <StatusBadge tone="premium">Legal</StatusBadge>
        <h1 className="text-5xl text-graphite sm:text-6xl">Cookie Policy</h1>
        <article className="surface-panel space-y-4 p-7 text-sm leading-7 text-graphite/78">
          <p>
            BERIL uses essential cookies for session handling, cart persistence, and basic
            site functionality.
          </p>
          <p>
            Optional analytics cookies may be used to improve product browsing and checkout
            performance.
          </p>
          <p>
            You can manage browser cookie settings at any time.
          </p>
        </article>
      </Container>
    </SectionWrapper>
  );
}
