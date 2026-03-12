import Link from "next/link";
import type { Metadata } from "next";

import { ContactQuickActions } from "@/components/content/contact-quick-actions";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSiteSettings } from "@/lib/db/site-settings";
import { getServerMessages } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Service",
  description: "Trusted watch and eyewear service requests in Gjilan by BERIL.",
  alternates: {
    canonical: "/service",
  },
  openGraph: {
    title: "BERIL Service",
    description: "Repair intake and maintenance support for watches and eyewear.",
    images: [{ url: "/placeholders/product-default.svg" }],
  },
};

function formatPhoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? `tel:${digits}` : `tel:+${digits}`;
}

function formatWhatsappHref(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export default async function ServicePage() {
  const [settings, messages] = await Promise.all([getSiteSettings(), getServerMessages()]);

  const phoneHref = formatPhoneHref(settings.storePhone);
  const whatsappHref = formatWhatsappHref(settings.storeWhatsapp);

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-9">
        <header className="space-y-4">
          <StatusBadge tone="service">{messages.servicePage.badge}</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">
            {messages.servicePage.title}
          </h1>
          <p className="max-w-3xl text-sm text-graphite/76 sm:text-base">
            {messages.servicePage.subtitle}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">{messages.servicePage.watchServicesTitle}</h2>
            <ul className="mt-4 space-y-2 text-sm text-graphite/78">
              {messages.servicePage.watchServices.map((service) => (
                <li key={service}>- {service}</li>
              ))}
            </ul>
          </article>
          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">{messages.servicePage.eyewearServicesTitle}</h2>
            <ul className="mt-4 space-y-2 text-sm text-graphite/78">
              {messages.servicePage.eyewearServices.map((service) => (
                <li key={service}>- {service}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="surface-panel p-7">
          <h2 className="text-3xl text-graphite">{messages.servicePage.howItWorksTitle}</h2>
          <ol className="mt-4 grid gap-2 text-sm text-graphite/78 sm:grid-cols-2">
            {messages.servicePage.howItWorksSteps.map((step, index) => (
              <li key={step}>{index + 1}. {step}</li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/service/request"
              className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
            >
              {messages.servicePage.startRepair}
            </Link>
            <Link
              href="/repair-track"
              className="inline-flex h-11 items-center rounded-full border border-graphite/20 bg-white/75 px-5 text-sm font-medium text-graphite"
            >
              {messages.servicePage.trackRepair}
            </Link>
          </div>
        </article>

        <article className="surface-panel p-7">
          <h2 className="text-3xl text-graphite">{messages.servicePage.directSupportTitle}</h2>
          <p className="mt-3 text-sm text-graphite/76">
            {messages.servicePage.directSupportBody}
          </p>
          <div className="mt-4">
            <ContactQuickActions
              phoneHref={phoneHref}
              whatsappHref={whatsappHref}
              mapUrl={settings.mapUrl}
              route="/service"
              source="service_cta"
            />
          </div>
        </article>
      </Container>
    </SectionWrapper>
  );
}
