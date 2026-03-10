import { saveSiteSettingsAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { getExtendedSiteSettings } from "@/lib/db/admin";

export default async function AdminSettingsPage() {
  const settings = await getExtendedSiteSettings();

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Settings</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Global Settings</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Manage contact channels, map destination, and checkout delivery defaults.
        </p>
      </header>

      <form action={saveSiteSettingsAction} className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
        <input
          name="business.name"
          defaultValue={settings.businessName}
          placeholder="Business name"
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
          name="store.hours"
          defaultValue={settings.storeHours}
          placeholder="Store hours"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.email"
          defaultValue={settings.storeEmail}
          placeholder="Store email"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="commerce.delivery_fee_home"
          defaultValue={settings.homeDeliveryFee}
          placeholder="Home delivery fee (EUR)"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.map_url"
          defaultValue={settings.mapUrl}
          placeholder="Map URL"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="store.address"
          defaultValue={settings.storeAddress}
          placeholder="Store address"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="seo.default_title"
          defaultValue={settings.defaultSeoTitle}
          placeholder="Default SEO title"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="seo.default_description"
          defaultValue={settings.defaultSeoDescription}
          rows={2}
          placeholder="Default SEO description"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="seo.default_image"
          defaultValue={settings.defaultSeoImage}
          placeholder="Default SEO image"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />

        <input type="hidden" name="hero.headline" value={settings.heroHeadline} />
        <input type="hidden" name="hero.subheadline" value={settings.heroSubheadline} />
        <input
          type="hidden"
          name="hero.primary_cta_label"
          value={settings.heroPrimaryCtaLabel}
        />
        <input
          type="hidden"
          name="hero.primary_cta_href"
          value={settings.heroPrimaryCtaHref}
        />
        <input
          type="hidden"
          name="hero.secondary_cta_label"
          value={settings.heroSecondaryCtaLabel}
        />
        <input
          type="hidden"
          name="hero.secondary_cta_href"
          value={settings.heroSecondaryCtaHref}
        />
        <input
          type="hidden"
          name="about.intro"
          value={settings.aboutIntro}
        />
        <input
          type="hidden"
          name="about.story"
          value={settings.aboutStory}
        />
        <input
          type="hidden"
          name="about.values"
          value={JSON.stringify(settings.aboutValues)}
        />
        <input type="hidden" name="home.trust_points" value={JSON.stringify(settings.trustPoints)} />
        <input
          type="hidden"
          name="home.service_highlights"
          value={JSON.stringify(settings.serviceHighlights)}
        />

        <button
          type="submit"
          className="sm:col-span-2 inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Save Settings
        </button>
      </form>
    </Container>
  );
}
