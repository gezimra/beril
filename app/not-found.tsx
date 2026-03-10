import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";

export default function NotFoundPage() {
  return (
    <SectionWrapper className="py-24">
      <Container>
        <div className="surface-panel mx-auto max-w-2xl p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-graphite/62">404</p>
          <h1 className="mt-2 text-5xl text-graphite">Page not found</h1>
          <p className="mt-4 text-sm text-graphite/72">
            The page you requested does not exist yet or has been moved.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
          >
            Return Home
          </Link>
        </div>
      </Container>
    </SectionWrapper>
  );
}
