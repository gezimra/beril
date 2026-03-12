import { saveSiteSettingsAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { getExtendedSiteSettings, listAdminContacts } from "@/lib/db/admin";

function buildListInputs(values: string[], minSlots = 4, maxSlots = 10) {
  const trimmed = values.map((value) => value.trim()).filter(Boolean);
  const slotCount = Math.min(Math.max(trimmed.length + 1, minSlots), maxSlots);
  return Array.from({ length: slotCount }, (_, index) => trimmed[index] ?? "");
}

export default async function AdminContentPage() {
  const [settings, contacts] = await Promise.all([
    getExtendedSiteSettings(),
    listAdminContacts(),
  ]);
  const aboutValuesInputs = buildListInputs(settings.aboutValues, 4, 12);
  const trustPointsInputs = buildListInputs(settings.trustPoints, 4, 12);
  const serviceHighlightsInputs = buildListInputs(settings.serviceHighlights, 4, 12);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Content</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Content Management</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Edit homepage sections, about content, and store-facing copy blocks.
        </p>
      </header>

      <form action={saveSiteSettingsAction} className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
        <p className="sm:col-span-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          Home Hero
        </p>
        <FloatInput
          label="Hero headline"
          name="hero.headline"
          defaultValue={settings.heroHeadline}
          wrapperClassName="sm:col-span-2"
        />
        <FloatTextarea
          label="Hero subheadline"
          name="hero.subheadline"
          defaultValue={settings.heroSubheadline}
          rows={3}
          wrapperClassName="sm:col-span-2"
        />
        <FloatInput
          label="Primary CTA label"
          name="hero.primary_cta_label"
          defaultValue={settings.heroPrimaryCtaLabel}
        />
        <FloatInput
          label="Primary CTA href"
          name="hero.primary_cta_href"
          defaultValue={settings.heroPrimaryCtaHref}
        />
        <FloatInput
          label="Secondary CTA label"
          name="hero.secondary_cta_label"
          defaultValue={settings.heroSecondaryCtaLabel}
        />
        <FloatInput
          label="Secondary CTA href"
          name="hero.secondary_cta_href"
          defaultValue={settings.heroSecondaryCtaHref}
        />

        <p className="sm:col-span-2 mt-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          About
        </p>
        <FloatTextarea
          label="About intro"
          name="about.intro"
          defaultValue={settings.aboutIntro}
          rows={2}
          wrapperClassName="sm:col-span-2"
        />
        <FloatTextarea
          label="About story"
          name="about.story"
          defaultValue={settings.aboutStory}
          rows={4}
          wrapperClassName="sm:col-span-2"
        />
        <div className="sm:col-span-2 space-y-2 rounded-lg border border-graphite/10 bg-white/60 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">About values</p>
          <input type="hidden" name="about.values" value={JSON.stringify(settings.aboutValues)} />
          {aboutValuesInputs.map((value, index) => (
            <FloatInput
              key={`about-values-${index}`}
              id={`about-values-${index}`}
              label={`Value ${index + 1}`}
              name="about.values[]"
              defaultValue={value}
            />
          ))}
          <p className="text-xs text-graphite/56">
            Fill as many items as needed. Empty rows are ignored.
          </p>
        </div>

        <p className="sm:col-span-2 mt-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          Trust and Service Lists
        </p>
        <div className="space-y-2 rounded-lg border border-graphite/10 bg-white/60 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Trust points</p>
          <input type="hidden" name="home.trust_points" value={JSON.stringify(settings.trustPoints)} />
          {trustPointsInputs.map((value, index) => (
            <FloatInput
              key={`trust-points-${index}`}
              id={`trust-points-${index}`}
              label={`Trust point ${index + 1}`}
              name="home.trust_points[]"
              defaultValue={value}
            />
          ))}
        </div>
        <div className="space-y-2 rounded-lg border border-graphite/10 bg-white/60 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Service highlights</p>
          <input
            type="hidden"
            name="home.service_highlights"
            value={JSON.stringify(settings.serviceHighlights)}
          />
          {serviceHighlightsInputs.map((value, index) => (
            <FloatInput
              key={`service-highlights-${index}`}
              id={`service-highlights-${index}`}
              label={`Service highlight ${index + 1}`}
              name="home.service_highlights[]"
              defaultValue={value}
            />
          ))}
        </div>

        <p className="sm:col-span-2 mt-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          Store
        </p>
        <FloatInput
          label="Store address"
          name="store.address"
          defaultValue={settings.storeAddress}
          wrapperClassName="sm:col-span-2"
        />
        <FloatInput
          label="Store hours"
          name="store.hours"
          defaultValue={settings.storeHours}
        />
        <FloatInput
          label="Store phone"
          name="store.phone"
          defaultValue={settings.storePhone}
        />
        <FloatInput
          label="Store email"
          name="store.email"
          defaultValue={settings.storeEmail}
        />
        <FloatInput
          label="Store whatsapp"
          name="store.whatsapp"
          defaultValue={settings.storeWhatsapp}
        />
        <FloatInput
          label="Map URL"
          name="store.map_url"
          defaultValue={settings.mapUrl}
        />
        <FloatInput
          label="Home delivery fee"
          name="commerce.delivery_fee_home"
          defaultValue={settings.homeDeliveryFee}
        />
        <input type="hidden" name="business.name" value={settings.businessName} />
        <input type="hidden" name="seo.default_title" value={settings.defaultSeoTitle} />
        <input
          type="hidden"
          name="seo.default_description"
          value={settings.defaultSeoDescription}
        />
        <input type="hidden" name="seo.default_image" value={settings.defaultSeoImage} />

        <button
          type="submit"
          className="sm:col-span-2 inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Save Content
        </button>
      </form>

      <section className="surface-panel p-5">
        <h2 className="text-2xl text-graphite">Contact Inquiries</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {contacts.length === 0 ? (
            <li className="text-graphite/72">No contact inquiries yet.</li>
          ) : (
            contacts.slice(0, 20).map((contact) => (
              <li key={contact.id} className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2">
                <p className="font-medium text-graphite">
                  {contact.subject} - {contact.name}
                </p>
                <p className="text-graphite/72">{contact.email}</p>
                <p className="text-graphite/72">{contact.message}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </Container>
  );
}
