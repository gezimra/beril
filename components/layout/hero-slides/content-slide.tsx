import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { HeroSlide } from "@/types/hero";

interface ContentSlideProps {
  slide: HeroSlide;
  messages: {
    location: string;
    supportingLine: string;
    pillarsLabel: string;
    pillars: {
      watches: { title: string; body: string };
      eyewear: { title: string; body: string };
      service: { title: string; body: string };
    };
  };
}

export function ContentSlide({ slide, messages }: ContentSlideProps) {
  return (
    <div className="hero-slide-frame grid gap-8 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-7">
        <div className="max-w-2xl space-y-6 sm:space-y-8">
          <StatusBadge tone="premium">{messages.location}</StatusBadge>
          <div className="space-y-4 sm:space-y-5">
            {slide.headline && (
              <h1 className="max-w-xl break-words text-4xl leading-tight text-graphite sm:text-6xl">
                {slide.headline}
              </h1>
            )}
            {slide.subheadline && (
              <p className="max-w-xl text-lg text-graphite/79">{slide.subheadline}</p>
            )}
            <p className="max-w-xl text-sm text-graphite/66 sm:text-[0.95rem]">
              {messages.supportingLine}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {slide.ctaLabel && slide.ctaHref && (
              <Link
                href={slide.ctaHref}
                className="inline-flex h-11 items-center rounded-full bg-walnut/92 px-6 text-sm font-medium text-white transition hover:bg-walnut"
              >
                {slide.ctaLabel}
              </Link>
            )}
            {slide.secondaryCtaLabel && slide.secondaryCtaHref && (
              <Link
                href={slide.secondaryCtaHref}
                className="inline-flex h-11 items-center rounded-full border border-graphite/16 bg-white/74 px-6 text-sm font-medium text-graphite transition hover:bg-white"
              >
                {slide.secondaryCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      <aside className="surface-panel-strong grid gap-3 p-6 lg:col-span-5">
        <p className="premium-eyebrow">{messages.pillarsLabel}</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[messages.pillars.watches, messages.pillars.eyewear, messages.pillars.service].map(
            (pillar) => (
              <article
                key={pillar.title}
                className="flex min-h-28 flex-col justify-center rounded-xl border border-graphite/10 bg-white/86 p-4"
              >
                <h2 className="text-[2rem] leading-none text-graphite">{pillar.title}</h2>
                <p className="mt-2 text-sm leading-6 text-graphite/73">{pillar.body}</p>
              </article>
            ),
          )}
        </div>
      </aside>
    </div>
  );
}
