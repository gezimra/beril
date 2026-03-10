import type { Metadata } from "next";
import Script from "next/script";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getExtendedSiteSettings } from "@/lib/db/admin";
import { localBusinessJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "About BERIL",
  description:
    "Learn BERIL's story, values, and approach to watches, eyewear, and trusted service in Gjilan.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About BERIL",
    description:
      "BERIL combines curated watches, refined eyewear, and trusted service in Gjilan.",
    images: [{ url: "/placeholders/product-default.svg" }],
  },
};

export default async function AboutPage() {
  const settings = await getExtendedSiteSettings();
  const businessJsonLd = localBusinessJsonLd(settings);

  return (
    <>
      <Script id="about-local-business" type="application/ld+json">
        {JSON.stringify(businessJsonLd)}
      </Script>

      <SectionWrapper className="py-16">
        <Container className="space-y-8">
          <header className="space-y-4">
            <StatusBadge tone="premium">About BERIL</StatusBadge>
            <h1 className="max-w-3xl text-5xl text-graphite sm:text-6xl">
              Precision, trust, and practical care in one local boutique.
            </h1>
            <p className="max-w-3xl text-sm text-graphite/76 sm:text-base">
              {settings.aboutIntro}
            </p>
          </header>

          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">Our Story</h2>
            <p className="mt-4 text-sm leading-7 text-graphite/76 sm:text-base">
              {settings.aboutStory}
            </p>
          </article>

          <section className="grid gap-5 md:grid-cols-2">
            <article className="surface-panel p-7">
              <h3 className="text-3xl text-graphite">Why Watches + Eyewear + Service</h3>
              <p className="mt-4 text-sm text-graphite/76 sm:text-base">
                BERIL serves customers who value both product quality and long-term care.
                We curate what we sell and stand behind it with practical service support.
              </p>
            </article>
            <article className="surface-panel p-7">
              <h3 className="text-3xl text-graphite">Values and Approach</h3>
              <ul className="mt-4 space-y-2 text-sm text-graphite/76 sm:text-base">
                {settings.aboutValues.map((value) => (
                  <li key={value}>- {value}</li>
                ))}
              </ul>
            </article>
          </section>
        </Container>
      </SectionWrapper>
    </>
  );
}
