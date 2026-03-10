import { getExtendedSiteSettings } from "@/lib/db/admin";
import type { SiteSettings } from "@/types/site-settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await getExtendedSiteSettings();
  return {
    businessName: settings.businessName,
    heroHeadline: settings.heroHeadline,
    heroSubheadline: settings.heroSubheadline,
    heroPrimaryCtaLabel: settings.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: settings.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: settings.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: settings.heroSecondaryCtaHref,
    trustPoints: settings.trustPoints,
    serviceHighlights: settings.serviceHighlights,
    storeAddress: settings.storeAddress,
    storeHours: settings.storeHours,
    storePhone: settings.storePhone,
    storeEmail: settings.storeEmail,
    storeWhatsapp: settings.storeWhatsapp,
    mapUrl: settings.mapUrl,
    homeDeliveryFee: settings.homeDeliveryFee,
    defaultSeoTitle: settings.defaultSeoTitle,
    defaultSeoDescription: settings.defaultSeoDescription,
    defaultSeoImage: settings.defaultSeoImage,
  };
}
