import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";

interface RoutePlaceholderProps {
  title: string;
  description: string;
  phase?: string;
  children?: ReactNode;
}

export function RoutePlaceholder({
  title,
  description,
  phase = "Planned in upcoming phase",
  children,
}: RoutePlaceholderProps) {
  return (
    <SectionWrapper className="py-20 sm:py-24">
      <Container>
        <div className="surface-panel mx-auto max-w-3xl p-7 sm:p-10">
          <StatusBadge tone="premium">{phase}</StatusBadge>
          <h1 className="mt-4 font-display text-4xl leading-tight text-graphite sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-graphite/76 sm:text-lg">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-walnut px-5 font-medium text-white"
            >
              Back to Home
            </Link>
            <Link
              href="/service/request"
              className="inline-flex h-11 items-center rounded-full border border-graphite/20 bg-white/70 px-5 font-medium text-graphite"
            >
              Request Service
            </Link>
          </div>
          {children}
        </div>
      </Container>
    </SectionWrapper>
  );
}
