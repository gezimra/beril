"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/track";

function readCookie(name: string) {
  const parts = document.cookie.split(";").map((part) => part.trim());
  const row = parts.find((part) => part.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : "";
}

export function AffiliateTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (!refCode) {
      return;
    }

    const normalizedRefCode = refCode.trim().toUpperCase();
    if (!normalizedRefCode) {
      return;
    }

    if (readCookie("beril_ref") === normalizedRefCode) {
      return;
    }

    void fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: normalizedRefCode,
        source: document.referrer || "direct",
        landingPage: `${window.location.pathname}${window.location.search}`,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          code?: string;
          affiliateId?: string;
        };

        if (!payload.ok || !payload.code) {
          return;
        }

        trackEvent("affiliate_click", {
          route: pathname,
          source: "affiliate_param",
          code: payload.code,
          affiliateId: payload.affiliateId,
        });
      })
      .catch(() => {
        // Ignore tracking errors.
      });
  }, [pathname, searchParams]);

  return null;
}

