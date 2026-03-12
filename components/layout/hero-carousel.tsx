"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play } from "lucide-react";

import { ContentSlide } from "@/components/layout/hero-slides/content-slide";
import { ImageSlide } from "@/components/layout/hero-slides/image-slide";
import { ProductSpotlightSlide } from "@/components/layout/hero-slides/product-spotlight-slide";
import { VideoSlide } from "@/components/layout/hero-slides/video-slide";
import { cn } from "@/lib/utils/cn";
import type { HeroSlide } from "@/types/hero";

const AUTOPLAY_INTERVAL = 6000;
const DRAG_THRESHOLD = 80;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "60%" : "-60%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-60%" : "60%",
    opacity: 0,
  }),
};

const reducedMotionVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

interface HeroCarouselProps {
  slides: HeroSlide[];
  messages: {
    home: {
      location: string;
      supportingLine: string;
      pillarsLabel: string;
      pillars: {
        watches: { title: string; body: string };
        eyewear: { title: string; body: string };
        service: { title: string; body: string };
      };
    };
  };
}

export function HeroCarousel({ slides, messages }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSingle = slides.length <= 1;
  const currentSlide = slides[currentIndex] ?? slides[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  const advance = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isSingle || isPaused || prefersReducedMotion) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(advance, AUTOPLAY_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSingle, isPaused, prefersReducedMotion, advance]);

  if (!currentSlide) {
    return null;
  }

  const variants = prefersReducedMotion ? reducedMotionVariants : slideVariants;
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Homepage hero"
      className="relative max-w-full overflow-hidden"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isSingle) {
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          advance();
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrevious();
        }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${currentIndex + 1} of ${slides.length}`}
            drag={isSingle ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x <= -DRAG_THRESHOLD) {
                advance();
                return;
              }

              if (info.offset.x >= DRAG_THRESHOLD) {
                goPrevious();
              }
            }}
          >
            {renderSlide(currentSlide, currentIndex === 0, messages)}
          </motion.div>
        </AnimatePresence>
      </div>

      {!isSingle && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="flex gap-2" role="tablist" aria-label="Slide indicators">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={cn(
                  "relative inline-flex h-2.5 items-center justify-center rounded-full border transition-all duration-300",
                  index === currentIndex
                    ? "w-8 border-graphite/30 bg-graphite/35"
                    : "w-2.5 border-graphite/10 bg-graphite/16 hover:bg-graphite/24",
                )}
              >
                <span className="sr-only">{`Slide ${index + 1}`}</span>
              </button>
            ))}
          </div>
          <button
            aria-label={isPaused ? "Resume carousel" : "Pause carousel"}
            onClick={() => setIsPaused(!isPaused)}
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-graphite/12 bg-white/72 text-graphite/60 transition hover:bg-white hover:text-graphite"
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}

function renderSlide(
  slide: HeroSlide,
  isFirst: boolean,
  messages: HeroCarouselProps["messages"],
) {
  switch (slide.slideType) {
    case "content":
      return (
        <ContentSlide
          slide={slide}
          messages={{
            location: messages.home.location,
            supportingLine: messages.home.supportingLine,
            pillarsLabel: messages.home.pillarsLabel,
            pillars: messages.home.pillars,
          }}
        />
      );
    case "image":
      return <ImageSlide slide={slide} isFirst={isFirst} />;
    case "video":
      return <VideoSlide slide={slide} isFirst={isFirst} />;
    case "product_spotlight":
      return <ProductSpotlightSlide slide={slide} isFirst={isFirst} />;
    default:
      return null;
  }
}
