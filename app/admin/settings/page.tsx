import { saveSiteSettingsAction, uploadSiteImageAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatTextarea } from "@/components/ui/float-field";
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
        <FloatInput
          label="Business name"
          name="business.name"
          defaultValue={settings.businessName}
        />
        <FloatInput
          label="Store phone"
          name="store.phone"
          defaultValue={settings.storePhone}
        />
        <FloatInput
          label="Store whatsapp"
          name="store.whatsapp"
          defaultValue={settings.storeWhatsapp}
        />
        <FloatInput
          label="Store hours"
          name="store.hours"
          defaultValue={settings.storeHours}
        />
        <FloatInput
          label="Store email"
          name="store.email"
          defaultValue={settings.storeEmail}
        />
        <FloatInput
          label="Home delivery fee (EUR)"
          name="commerce.delivery_fee_home"
          defaultValue={settings.homeDeliveryFee}
        />
        <FloatInput
          label="Map URL"
          name="store.map_url"
          defaultValue={settings.mapUrl}
          wrapperClassName="sm:col-span-2"
        />
        <FloatInput
          label="Store address"
          name="store.address"
          defaultValue={settings.storeAddress}
          wrapperClassName="sm:col-span-2"
        />
        <FloatInput
          label="Default SEO title"
          name="seo.default_title"
          defaultValue={settings.defaultSeoTitle}
          wrapperClassName="sm:col-span-2"
        />
        <FloatTextarea
          label="Default SEO description"
          name="seo.default_description"
          defaultValue={settings.defaultSeoDescription}
          rows={2}
          wrapperClassName="sm:col-span-2"
        />
        <input type="hidden" name="seo.default_image" value={settings.defaultSeoImage} />

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

      <form
        action={uploadSiteImageAction}
        className="surface-panel grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <input type="hidden" name="settingKey" value="seo.default_image" />
        <div className="sm:col-span-3">
          <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
            Default SEO Image
          </p>
          {settings.defaultSeoImage ? (
            <a
              href={settings.defaultSeoImage}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-graphite/72 underline"
            >
              Current image
            </a>
          ) : (
            <p className="mt-1 text-xs text-graphite/50">No image set</p>
          )}
        </div>
        <input
          type="file"
          name="siteImageFile"
          accept="image/*"
          required
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
        >
          Upload SEO Image
        </button>
      </form>
    </Container>
  );
}
