import type { HeroSlideType } from "@/types/domain";

export interface HeroSlide {
  id: string;
  slideType: HeroSlideType;
  sortOrder: number;
  headline: string | null;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  backgroundImageUrl: string | null;
  backgroundImageAlt: string | null;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  product: HeroSlideProduct | null;
}

export interface HeroSlideProduct {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number;
  currency: "EUR";
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
}
