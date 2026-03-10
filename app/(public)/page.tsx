import Link from "next/link";
import Script from "next/script";

import { ContactQuickActions } from "@/components/content/contact-quick-actions";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFeaturedProducts, getMovementLabel } from "@/lib/db/catalog";
import { getSiteSettings } from "@/lib/db/site-settings";
import { localBusinessJsonLd } from "@/lib/seo/structured-data";

function formatPhoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? `tel:${digits}` : `tel:+${digits}`;
}

function formatWhatsappHref(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export default async function HomePage() {
  const [settings, featuredWatches, featuredEyewear] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts("watch", 4),
    getFeaturedProducts("eyewear", 4),
  ]);
  const businessJsonLd = localBusinessJsonLd(settings);
  const phoneHref = formatPhoneHref(settings.storePhone);
  const whatsappHref = formatWhatsappHref(settings.storeWhatsapp);

  return (
    <>
      <Script id="home-local-business" type="application/ld+json">
        {JSON.stringify(businessJsonLd)}
      </Script>

      <SectionWrapper className="pb-10 pt-16 sm:pt-24">
        <Container className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-6 lg:col-span-7">
            <StatusBadge tone="premium">Gjilan, Kosovo</StatusBadge>
            <h1 className="max-w-2xl text-5xl leading-tight text-graphite sm:text-6xl">
              {settings.heroHeadline}
            </h1>
            <p className="max-w-2xl text-lg text-graphite/78">
              {settings.heroSubheadline}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={settings.heroPrimaryCtaHref}
                className="inline-flex h-11 items-center rounded-full bg-walnut px-6 text-sm font-medium text-white"
              >
                {settings.heroPrimaryCtaLabel}
              </Link>
              <Link
                href={settings.heroSecondaryCtaHref}
                className="inline-flex h-11 items-center rounded-full border border-graphite/20 bg-white/70 px-6 text-sm font-medium text-graphite"
              >
                {settings.heroSecondaryCtaLabel}
              </Link>
            </div>
          </div>

          <div className="surface-panel grid gap-4 p-6 lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.22em] text-graphite/60">
              BERIL Pillars
            </p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  title: "Watches",
                  body: "Curated models with precise movement and balanced styling.",
                },
                {
                  title: "Eyewear",
                  body: "Refined frames and sunglasses chosen for fit and character.",
                },
                {
                  title: "Service",
                  body: "Trusted local diagnostics, repairs, and practical maintenance.",
                },
              ].map((pillar) => (
                <article
                  key={pillar.title}
                  className="rounded-xl border border-graphite/10 bg-white/78 p-4"
                >
                  <h2 className="text-xl text-graphite">{pillar.title}</h2>
                  <p className="mt-1 text-sm text-graphite/72">{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper className="pt-6">
        <Container className="space-y-12">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-4xl text-graphite">Featured Watches</h2>
              <Link
                href="/watches"
                className="text-xs uppercase tracking-[0.14em] text-graphite/70 hover:text-graphite"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
              {featuredWatches.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  movementLabel={getMovementLabel(product)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-4xl text-graphite">Featured Eyewear</h2>
              <Link
                href="/eyewear"
                className="text-xs uppercase tracking-[0.14em] text-graphite/70 hover:text-graphite"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
              {featuredEyewear.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container className="grid gap-6 lg:grid-cols-2">
          <article className="surface-panel p-7">
            <StatusBadge tone="service">Trusted Service</StatusBadge>
            <h2 className="mt-4 text-4xl text-graphite">Watch and Eyewear Care</h2>
            <ul className="mt-5 grid gap-2 text-sm text-graphite/78">
              {settings.serviceHighlights.map((highlight) => (
                <li key={highlight}>- {highlight}</li>
              ))}
            </ul>
            <Link
              href="/service"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-mineral px-5 text-sm font-medium text-white"
            >
              Explore Service
            </Link>
          </article>

          <article className="surface-panel p-7">
            <StatusBadge tone="premium">Store Visit</StatusBadge>
            <h2 className="mt-4 text-4xl text-graphite">Visit BERIL in Gjilan</h2>
            <p className="mt-3 text-sm text-graphite/76">{settings.storeAddress}</p>
            <p className="mt-2 text-sm text-graphite/76">{settings.storeHours}</p>
            <p className="mt-2 text-sm text-graphite/76">
              Phone: {settings.storePhone}
            </p>
            <div className="mt-6">
              <ContactQuickActions
                phoneHref={phoneHref}
                whatsappHref={whatsappHref}
                mapUrl={settings.mapUrl}
                route="/"
                source="home_store"
              />
            </div>
          </article>
        </Container>
      </SectionWrapper>

      <SectionWrapper className="pt-2">
        <Container>
          <article className="surface-panel p-6">
            <StatusBadge tone="warm">Why Customers Trust BERIL</StatusBadge>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {settings.trustPoints.map((point) => (
                <p
                  key={point}
                  className="rounded-xl border border-graphite/10 bg-white/70 px-4 py-3 text-sm text-graphite/76"
                >
                  {point}
                </p>
              ))}
            </div>
          </article>
        </Container>
      </SectionWrapper>
    </>
  );
}
