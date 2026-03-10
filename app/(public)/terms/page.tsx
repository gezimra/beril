import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for BERIL website and services.",
};

export default function TermsPage() {
  return (
    <SectionWrapper className="py-16">
      <Container className="max-w-4xl space-y-6">
        <StatusBadge tone="premium">Legal</StatusBadge>
        <h1 className="text-5xl text-graphite sm:text-6xl">Terms and Conditions</h1>
        <article className="surface-panel space-y-4 p-7 text-sm leading-7 text-graphite/78">
          <p>
            Product availability, repair timelines, and delivery estimates are subject to
            confirmation by BERIL staff.
          </p>
          <p>
            Cash on delivery and in-store payment are the accepted payment methods for
            current online orders.
          </p>
          <p>
            Repair status and completion dates are indicative and may change depending on
            diagnostics and parts availability.
          </p>
        </article>
      </Container>
    </SectionWrapper>
  );
}
