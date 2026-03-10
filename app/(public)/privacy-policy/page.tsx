import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for BERIL website and services.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "BERIL Privacy Policy",
    description: "Privacy policy for BERIL website and service operations.",
    images: [{ url: "/placeholders/product-default.svg" }],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <SectionWrapper className="py-16">
      <Container className="max-w-4xl space-y-6">
        <StatusBadge tone="premium">Legal</StatusBadge>
        <h1 className="text-5xl text-graphite sm:text-6xl">Privacy Policy</h1>
        <article className="surface-panel space-y-4 p-7 text-sm leading-7 text-graphite/78">
          <p>
            BERIL collects contact, order, and repair information only to process
            requests and provide service updates.
          </p>
          <p>
            We store customer details necessary for delivery, pickup coordination, and
            repair tracking. Data is not sold to third parties.
          </p>
          <p>
            Customers may request correction or removal of personal data by contacting
            BERIL directly.
          </p>
        </article>
      </Container>
    </SectionWrapper>
  );
}
