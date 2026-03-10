import { saveSiteSettingsAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { getExtendedSiteSettings, listAdminContacts } from "@/lib/db/admin";

export default async function AdminContentPage() {
  const [settings, contacts] = await Promise.all([
    getExtendedSiteSettings(),
    listAdminContacts(),
  ]);

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
        <input
          name="hero.headline"
          defaultValue={settings.heroHeadline}
          placeholder="Hero headline"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="hero.subheadline"
          defaultValue={settings.heroSubheadline}
          rows={3}
          placeholder="Hero subheadline"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="hero.primary_cta_label"
          defaultValue={settings.heroPrimaryCtaLabel}
          placeholder="Primary CTA label"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="hero.primary_cta_href"
          defaultValue={settings.heroPrimaryCtaHref}
          placeholder="Primary CTA href"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="hero.secondary_cta_label"
          defaultValue={settings.heroSecondaryCtaLabel}
          placeholder="Secondary CTA label"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="hero.secondary_cta_href"
          defaultValue={settings.heroSecondaryCtaHref}
          placeholder="Secondary CTA href"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />

        <p className="sm:col-span-2 mt-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          About
        </p>
        <textarea
          name="about.intro"
          defaultValue={settings.aboutIntro}
          rows={2}
          placeholder="About intro"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="about.story"
          defaultValue={settings.aboutStory}
          rows={4}
          placeholder="About story"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="about.values"
          defaultValue={JSON.stringify(settings.aboutValues)}
          rows={3}
          placeholder='["Precision","Trust","Craft"]'
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />

        <p className="sm:col-span-2 mt-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          Trust and Service Lists
        </p>
        <textarea
          name="home.trust_points"
          defaultValue={JSON.stringify(settings.trustPoints)}
          rows={4}
          placeholder='["Point 1","Point 2"]'
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="home.service_highlights"
          defaultValue={JSON.stringify(settings.serviceHighlights)}
          rows={4}
          placeholder='["Service 1","Service 2"]'
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />

        <p className="sm:col-span-2 mt-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          Store
        </p>
        <input
          name="store.address"
          defaultValue={settings.storeAddress}
          placeholder="Store address"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.hours"
          defaultValue={settings.storeHours}
          placeholder="Store hours"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.phone"
          defaultValue={settings.storePhone}
          placeholder="Store phone"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.whatsapp"
          defaultValue={settings.storeWhatsapp}
          placeholder="Store whatsapp"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.map_url"
          defaultValue={settings.mapUrl}
          placeholder="Map URL"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="commerce.delivery_fee_home"
          defaultValue="3.00"
          placeholder="Home delivery fee"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />

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
