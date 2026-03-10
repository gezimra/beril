"use client";

import { trackEvent } from "@/lib/analytics/track";

interface ContactQuickActionsProps {
  phoneHref: string;
  whatsappHref: string;
  mapUrl: string;
}

export function ContactQuickActions({
  phoneHref,
  whatsappHref,
  mapUrl,
}: ContactQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={phoneHref}
        onClick={() =>
          trackEvent("click_call", { route: "/contact", source: "contact_cta" })
        }
        className="inline-flex h-10 items-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
      >
        Call
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          trackEvent("click_whatsapp", {
            route: "/contact",
            source: "contact_cta",
            destination: whatsappHref,
          })
        }
        className="inline-flex h-10 items-center rounded-full border border-mineral/35 bg-mineral/12 px-4 text-xs uppercase tracking-[0.12em] text-mineral"
      >
        WhatsApp
      </a>
      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          trackEvent("map_click", {
            route: "/contact",
            source: "contact_cta",
            destination: mapUrl,
          })
        }
        className="inline-flex h-10 items-center rounded-full border border-graphite/20 bg-white/75 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
      >
        Get Directions
      </a>
    </div>
  );
}
