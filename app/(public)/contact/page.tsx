import type { Metadata } from "next";
import Script from "next/script";

import { ContactForm } from "@/components/content/contact-form";
import { ContactQuickActions } from "@/components/content/contact-quick-actions";
import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { getExtendedSiteSettings } from "@/lib/db/admin";
import { localBusinessJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Contact BERIL",
  description:
    "Contact BERIL in Gjilan for watches, eyewear, and repair service.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact BERIL",
    description: "Reach BERIL in Gjilan for products, service, and repair intake.",
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

export default async function ContactPage() {
  const settings = await getExtendedSiteSettings();
  const businessJsonLd = localBusinessJsonLd(settings);

  const phoneHref = formatPhoneHref(settings.storePhone);
  const whatsappHref = formatWhatsappHref(settings.storeWhatsapp);

  return (
    <>
      <Script id="contact-local-business" type="application/ld+json">
        {JSON.stringify(businessJsonLd)}
      </Script>

      <SectionWrapper className="py-16">
        <Container className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="surface-panel p-6 sm:p-7">
            <StatusBadge tone="premium">Contact BERIL</StatusBadge>
            <h1 className="mt-4 text-5xl text-graphite sm:text-6xl">Get in Touch</h1>
            <p className="mt-3 text-sm text-graphite/76 sm:text-base">
              Reach BERIL for product inquiries, service requests, and store support.
            </p>

            <div className="mt-6">
              <ContactForm />
            </div>
          </section>

          <aside className="space-y-4">
            <article className="surface-panel p-5">
              <h2 className="text-2xl text-graphite">Store Details</h2>
              <p className="mt-3 text-sm text-graphite/76">{settings.storeAddress}</p>
              <p className="mt-2 text-sm text-graphite/76">{settings.storeHours}</p>
              <p className="mt-2 text-sm text-graphite/76">{settings.storePhone}</p>
              <p className="mt-1 text-sm text-graphite/76">{settings.storeEmail}</p>
              <p className="mt-1 text-sm text-graphite/76">{settings.storeWhatsapp}</p>
            </article>
            <article className="surface-panel p-5">
              <h3 className="text-xl text-graphite">Quick Actions</h3>
              <div className="mt-4">
                <ContactQuickActions
                  phoneHref={phoneHref}
                  whatsappHref={whatsappHref}
                  mapUrl={settings.mapUrl}
                  route="/contact"
                  source="contact_cta"
                />
              </div>
            </article>
            <article className="surface-panel overflow-hidden p-0">
              <iframe
                title="BERIL store location map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.storeAddress)}&output=embed`}
                loading="lazy"
                className="h-60 w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </article>
          </aside>
        </Container>
      </SectionWrapper>
    </>
  );
}
