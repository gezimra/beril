import Link from "next/link";
import type { Metadata } from "next";

import { ContactQuickActions } from "@/components/content/contact-quick-actions";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSiteSettings } from "@/lib/db/site-settings";

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
  const settings = await getSiteSettings();
  const watchServices = [
    "Battery replacement",
    "Strap replacement",
    "Bracelet resizing",
    "Diagnostics",
    "Cleaning intake",
    "Mechanical repair intake",
    "Vintage assessment",
  ];

  const eyewearServices = [
    "Frame adjustment",
    "Nose pad replacement",
    "Screw tightening",
    "Fitting and alignment",
    "Minor service work",
  ];

  const phoneHref = formatPhoneHref(settings.storePhone);
  const whatsappHref = formatWhatsappHref(settings.storeWhatsapp);

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-9">
        <header className="space-y-4">
          <StatusBadge tone="service">Service</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">
            Trusted service for watches and eyewear
          </h1>
          <p className="max-w-3xl text-sm text-graphite/76 sm:text-base">
            BERIL offers practical diagnostics, repair intake, and adjustment
            services with transparent status updates.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">Watch Services</h2>
            <ul className="mt-4 space-y-2 text-sm text-graphite/78">
              {watchServices.map((service) => (
                <li key={service}>- {service}</li>
              ))}
            </ul>
          </article>
          <article className="surface-panel p-7">
            <h2 className="text-3xl text-graphite">Eyewear Services</h2>
            <ul className="mt-4 space-y-2 text-sm text-graphite/78">
              {eyewearServices.map((service) => (
                <li key={service}>- {service}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="surface-panel p-7">
          <h2 className="text-3xl text-graphite">How It Works</h2>
          <ol className="mt-4 grid gap-2 text-sm text-graphite/78 sm:grid-cols-2">
            <li>1. Request service online.</li>
            <li>2. Bring the item or arrange drop-off.</li>
            <li>3. BERIL inspects and updates status.</li>
            <li>4. Pickup or completion confirmation.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/service/request"
              className="inline-flex h-11 items-center rounded-full bg-walnut px-5 text-sm font-medium text-white"
            >
              Start Repair Request
            </Link>
            <Link
              href="/repair-track"
              className="inline-flex h-11 items-center rounded-full border border-graphite/20 bg-white/75 px-5 text-sm font-medium text-graphite"
            >
              Track Repair
            </Link>
          </div>
        </article>

        <article className="surface-panel p-7">
          <h2 className="text-3xl text-graphite">Need Direct Support?</h2>
          <p className="mt-3 text-sm text-graphite/76">
            Call or message BERIL before drop-off if you need guidance on service type.
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
