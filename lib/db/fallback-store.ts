import { mockProducts, mockSiteSettings } from "@/lib/db/mock-data";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type {
  AdminContact,
  AdminHeroSlide,
  AdminJournalPost,
  AdminOrder,
  AdminRepair,
} from "@/types/admin";
import type { Product } from "@/types/product";

const nowIso = () => new Date().toISOString();

const fallbackSiteSettings = new Map<string, string>([
  ["business.name", mockSiteSettings.businessName],
  ["hero.headline", mockSiteSettings.heroHeadline],
  ["hero.subheadline", mockSiteSettings.heroSubheadline],
  ["hero.primary_cta_label", mockSiteSettings.heroPrimaryCtaLabel],
  ["hero.primary_cta_href", mockSiteSettings.heroPrimaryCtaHref],
  ["hero.secondary_cta_label", mockSiteSettings.heroSecondaryCtaLabel],
  ["hero.secondary_cta_href", mockSiteSettings.heroSecondaryCtaHref],
  ["home.trust_points", JSON.stringify(mockSiteSettings.trustPoints)],
  ["home.service_highlights", JSON.stringify(mockSiteSettings.serviceHighlights)],
  ["store.address", mockSiteSettings.storeAddress],
  ["store.hours", mockSiteSettings.storeHours],
  ["store.phone", mockSiteSettings.storePhone],
  ["store.email", mockSiteSettings.storeEmail],
  ["store.whatsapp", mockSiteSettings.storeWhatsapp],
  ["store.map_url", mockSiteSettings.mapUrl],
  ["commerce.delivery_fee_home", mockSiteSettings.homeDeliveryFee],
  ["seo.default_title", mockSiteSettings.defaultSeoTitle],
  ["seo.default_description", mockSiteSettings.defaultSeoDescription],
  ["seo.default_image", mockSiteSettings.defaultSeoImage],
  ["about.intro", "BERIL is a local boutique for watches, eyewear, and trusted service."],
  ["about.story", "We combine curated selection and practical service care in Gjilan."],
  ["about.values", JSON.stringify(["Precision", "Trust", "Craft", "Calm service"])],
]);

const fallbackJournalPosts: AdminJournalPost[] = [
  {
    id: "jp-1",
    slug: "si-te-zgjidhni-nje-ore",
    title: "Si te zgjidhni nje ore",
    excerpt: "Udhezues i shkurter per zgjedhjen e ores sipas stilit dhe perdorimit.",
    content:
      "Zgjedhja e ores fillon me menyren si e perdorni cdo dite. Fokusohuni te madhesia e kases, lloji i mekanizmit dhe komforti i rripit.",
    coverImage: "/placeholders/product-default.svg",
    status: "published",
    publishedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "jp-2",
    slug: "kur-nderrohet-bateria",
    title: "Kur nderrohet bateria e ores",
    excerpt: "Shenjat praktike qe tregojne se bateria duhet nderruar.",
    content:
      "Nese ora ndalon papritur, ose ecen me intervale, bateria zakonisht eshte ne fund te ciklit te saj.",
    coverImage: "/placeholders/product-default.svg",
    status: "published",
    publishedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "jp-3",
    slug: "kujdesi-baze-per-syzet",
    title: "Kujdesi baze per syzet",
    excerpt: "Keshilla te shpejta per mirembajtjen e syzeve ne perdorim ditor.",
    content:
      "Pastroni syzet me material te bute dhe shmangni vendosjen e tyre me lente ne siperfaqe te forta.",
    coverImage: "/placeholders/product-default.svg",
    status: "draft",
    publishedAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const fallbackOrders: AdminOrder[] = [];
const fallbackRepairs: AdminRepair[] = [];
const fallbackContacts: AdminContact[] = [];
const fallbackProducts: Product[] = [...mockProducts];

export function getFallbackOrders() {
  return fallbackOrders;
}

export function getFallbackRepairs() {
  return fallbackRepairs;
}

export function getFallbackContacts() {
  return fallbackContacts;
}

export function getFallbackProducts() {
  return fallbackProducts;
}

export function getFallbackJournalPosts() {
  return fallbackJournalPosts;
}

export function getFallbackSiteSettings() {
  return fallbackSiteSettings;
}

export function addFallbackOrder(order: AdminOrder) {
  fallbackOrders.unshift(order);
}

export function addFallbackRepair(repair: AdminRepair) {
  fallbackRepairs.unshift(repair);
}

export function addFallbackContact(contact: AdminContact) {
  fallbackContacts.unshift(contact);
}

export function upsertFallbackJournalPost(post: AdminJournalPost) {
  const index = fallbackJournalPosts.findIndex((item) => item.id === post.id);
  if (index === -1) {
    fallbackJournalPosts.unshift(post);
    return;
  }

  fallbackJournalPosts[index] = post;
}

export function updateFallbackJournalCoverImage(postId: string, coverImage: string) {
  const index = fallbackJournalPosts.findIndex((item) => item.id === postId);
  if (index === -1) {
    return;
  }

  fallbackJournalPosts[index] = {
    ...fallbackJournalPosts[index],
    coverImage,
    updatedAt: nowIso(),
  };
}

export function updateFallbackSiteSetting(key: string, value: string) {
  fallbackSiteSettings.set(key, value);
}

export function updateFallbackOrder(
  orderId: string,
  updates: Partial<AdminOrder>,
): AdminOrder | null {
  const index = fallbackOrders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return null;
  }

  const updated = {
    ...fallbackOrders[index],
    ...updates,
    updatedAt: nowIso(),
  };
  fallbackOrders[index] = updated;
  return updated;
}

export function updateFallbackRepair(
  repairId: string,
  updates: Partial<AdminRepair>,
): AdminRepair | null {
  const index = fallbackRepairs.findIndex((repair) => repair.id === repairId);
  if (index === -1) {
    return null;
  }

  const updated = {
    ...fallbackRepairs[index],
    ...updates,
    updatedAt: nowIso(),
  };
  fallbackRepairs[index] = updated;
  return updated;
}

export function addFallbackRepairAttachment(input: {
  repairId: string;
  fileUrl: string;
  fileType: string;
  fileLabel?: string | null;
}) {
  const target = fallbackRepairs.find((repair) => repair.id === input.repairId);
  if (!target) {
    return;
  }

  if (!target.attachments) {
    target.attachments = [];
  }

  target.attachments.unshift({
    id: `att-${Date.now()}`,
    fileUrl: input.fileUrl,
    fileType: input.fileType,
    fileLabel: input.fileLabel ?? null,
    createdAt: nowIso(),
  });
  target.updatedAt = nowIso();
}

export function upsertFallbackProduct(product: Product) {
  const index = fallbackProducts.findIndex((item) => item.id === product.id);
  if (index === -1) {
    fallbackProducts.unshift(product);
    return;
  }

  fallbackProducts[index] = product;
}

const fallbackHeroSlides: AdminHeroSlide[] = [];

export function getFallbackHeroSlides() {
  return fallbackHeroSlides;
}

export function upsertFallbackHeroSlide(slide: AdminHeroSlide) {
  const index = fallbackHeroSlides.findIndex((item) => item.id === slide.id);
  if (index === -1) {
    fallbackHeroSlides.push(slide);
  } else {
    fallbackHeroSlides[index] = slide;
  }
  fallbackHeroSlides.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function deleteFallbackHeroSlide(slideId: string) {
  const index = fallbackHeroSlides.findIndex((item) => item.id === slideId);
  if (index !== -1) {
    fallbackHeroSlides.splice(index, 1);
  }
}

export function getFallbackCustomerKey(email?: string | null, phone?: string | null) {
  if (email) {
    return `email:${normalizeEmail(email)}`;
  }
  if (phone) {
    return `phone:${normalizePhone(phone)}`;
  }
  return "anon:unknown";
}
