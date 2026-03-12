import Link from "next/link";

import type { HeroSlide } from "@/types/hero";

interface VideoSlideProps {
  slide: HeroSlide;
  isFirst: boolean;
}

export function VideoSlide({ slide, isFirst }: VideoSlideProps) {
  return (
    <div className="hero-slide-frame relative overflow-hidden rounded-[var(--radius-card)]">
      {slide.videoUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={slide.videoPosterUrl ?? undefined}
          preload={isFirst ? "metadata" : "none"}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={slide.videoUrl} />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-graphite/65 via-graphite/25 to-transparent" />
      <div className="hero-slide-frame relative z-10 flex flex-col items-center justify-center px-6 text-center">
        {slide.headline && (
          <h2 className="max-w-2xl break-words text-4xl leading-tight text-white sm:text-6xl">
            {slide.headline}
          </h2>
        )}
        {slide.subheadline && (
          <p className="mt-4 max-w-xl text-lg text-white/85">{slide.subheadline}</p>
        )}
        {slide.ctaLabel && slide.ctaHref && (
          <Link
            href={slide.ctaHref}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-walnut/92 px-6 text-sm font-medium text-white transition hover:bg-walnut"
          >
            {slide.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
