import Link from "next/link";
import Script from "next/script";
import { ArrowRight, CheckCircle2, Clock3, MapPin, PhoneCall, ShieldCheck } from "lucide-react";

import { ContactQuickActions } from "@/components/content/contact-quick-actions";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFeaturedProducts, getMovementLabel } from "@/lib/db/catalog";
import { getSiteSettings } from "@/lib/db/site-settings";
import { getMessages } from "@/lib/i18n";
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
  const messages = getMessages();
  const [settings, featuredWatches, featuredEyewear] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts("watch", 4),
    getFeaturedProducts("eyewear", 4),
  ]);
  const businessJsonLd = localBusinessJsonLd(settings);
  const phoneHref = formatPhoneHref(settings.storePhone);
  const whatsappHref = formatWhatsappHref(settings.storeWhatsapp);
  const heroHeadline = settings.heroHeadline || messages.home.headline;
  const trustPoints =
    settings.trustPoints.length > 0
      ? settings.trustPoints
      : [...messages.home.trust.items];

  return (
    <>
      <Script id="home-local-business" type="application/ld+json">
        {JSON.stringify(businessJsonLd)}
      </Script>

      <SectionWrapper className="section-rhythm-loose pb-10 sm:pb-14">
        <Container className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="max-w-2xl space-y-6 sm:space-y-8">
              <StatusBadge tone="premium">{messages.home.location}</StatusBadge>
              <div className="space-y-4 sm:space-y-5">
                <h1 className="max-w-xl text-5xl leading-tight text-graphite sm:text-6xl">
                  {heroHeadline}
                </h1>
                <p className="max-w-xl text-lg text-graphite/79">
                  {settings.heroSubheadline}
                </p>
                <p className="max-w-xl text-sm text-graphite/66 sm:text-[0.95rem]">
                  {messages.home.supportingLine}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={settings.heroPrimaryCtaHref}
                  className="inline-flex h-11 items-center rounded-full bg-walnut/92 px-6 text-sm font-medium text-white transition hover:bg-walnut"
                >
                  {settings.heroPrimaryCtaLabel}
                </Link>
                <Link
                  href={settings.heroSecondaryCtaHref}
                  className="inline-flex h-11 items-center rounded-full border border-graphite/16 bg-white/74 px-6 text-sm font-medium text-graphite transition hover:bg-white"
                >
                  {settings.heroSecondaryCtaLabel}
                </Link>
              </div>
            </div>
          </div>

          <aside className="surface-panel-strong grid gap-3 p-6 lg:col-span-5">
            <p className="premium-eyebrow">{messages.home.pillarsLabel}</p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                messages.home.pillars.watches,
                messages.home.pillars.eyewear,
                messages.home.pillars.service,
              ].map((pillar) => (
                <article
                  key={pillar.title}
                  className="flex min-h-28 flex-col justify-center rounded-xl border border-graphite/10 bg-white/86 p-4"
                >
                  <h2 className="text-[2rem] leading-none text-graphite">{pillar.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-graphite/73">{pillar.body}</p>
                </article>
              ))}
            </div>
          </aside>
        </Container>
      </SectionWrapper>

      <SectionWrapper className="section-rhythm-tight pt-4">
        <Container className="space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-graphite/10 pb-4">
            <div className="space-y-2">
              <p className="premium-eyebrow">{messages.home.featured.watchesEyebrow}</p>
              <h2 className="text-4xl text-graphite">{messages.home.featured.watchesTitle}</h2>
              <p className="section-intro-line">{messages.home.featured.watchesSubline}</p>
            </div>
            <Link
              href="/watches"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-graphite/14 bg-white/80 px-4 text-xs uppercase tracking-[0.14em] text-graphite/75 transition hover:bg-white hover:text-graphite"
            >
              {messages.home.featured.viewAll}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>

          <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
            {featuredWatches.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                movementLabel={getMovementLabel(product)}
              />
            ))}
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper className="section-rhythm-tight">
        <Container className="grid gap-6 lg:grid-cols-2">
          <article className="surface-panel p-6 sm:p-7">
            <StatusBadge tone="service">{messages.home.serviceStore.serviceBadge}</StatusBadge>
            <h2 className="mt-4 text-4xl text-graphite">
              {messages.home.serviceStore.serviceTitle}
            </h2>
            <ul className="mt-5 space-y-2.5">
              {settings.serviceHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2.5 text-sm text-graphite/78">
                  <CheckCircle2 className="mt-[1px] h-4 w-4 shrink-0 text-mineral/80" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/service"
              className="mt-6 inline-flex h-10 items-center rounded-full bg-mineral px-5 text-sm font-medium text-white transition hover:bg-mineral/92"
            >
              {messages.home.serviceStore.serviceCta}
            </Link>
          </article>

          <article className="surface-panel p-6 sm:p-7">
            <StatusBadge tone="premium">{messages.home.serviceStore.storeBadge}</StatusBadge>
            <h2 className="mt-4 text-4xl text-graphite">
              {messages.home.serviceStore.storeTitle}
            </h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-graphite/78">
                <MapPin className="mt-[2px] h-4 w-4 shrink-0 text-mineral/85" />
                <div>
                  <p className="label-muted">{messages.home.serviceStore.storeMetaAddress}</p>
                  <p className="mt-1">{settings.storeAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-graphite/78">
                <Clock3 className="mt-[2px] h-4 w-4 shrink-0 text-mineral/85" />
                <div>
                  <p className="label-muted">{messages.home.serviceStore.storeMetaHours}</p>
                  <p className="mt-1">{settings.storeHours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-graphite/78">
                <PhoneCall className="mt-[2px] h-4 w-4 shrink-0 text-mineral/85" />
                <div>
                  <p className="label-muted">{messages.home.serviceStore.storeMetaPhone}</p>
                  <p className="mt-1">{settings.storePhone}</p>
                </div>
              </div>
            </div>

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

      <SectionWrapper className="section-rhythm-tight">
        <Container className="space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-graphite/10 pb-4">
            <div className="space-y-2">
              <p className="premium-eyebrow">{messages.home.featured.eyewearEyebrow}</p>
              <h2 className="text-4xl text-graphite">{messages.home.featured.eyewearTitle}</h2>
              <p className="section-intro-line">{messages.home.featured.eyewearSubline}</p>
            </div>
            <Link
              href="/eyewear"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-graphite/14 bg-white/80 px-4 text-xs uppercase tracking-[0.14em] text-graphite/75 transition hover:bg-white hover:text-graphite"
            >
              {messages.home.featured.viewAll}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>

          <div className="grid grid-cols-2 gap-4 lg:gap-5 xl:grid-cols-4">
            {featuredEyewear.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper className="section-rhythm-tight pt-3">
        <Container>
          <article className="surface-panel-strong p-6 sm:p-7">
            <StatusBadge tone="warm">{messages.home.trust.badge}</StatusBadge>
            <p className="mt-4 section-intro-line">{messages.home.trust.intro}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div key={point} className="trust-row">
                  <ShieldCheck className="mt-[1px] h-4 w-4 shrink-0 text-mineral/82" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </article>
        </Container>
      </SectionWrapper>
    </>
  );
}
