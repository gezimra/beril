"use client";

import { env } from "@/lib/env";
import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "@/lib/analytics/events";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent<T extends AnalyticsEventName>(
  eventName: T,
  payload: AnalyticsEventPayload<T>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!env.client.gaMeasurementId || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, payload);
}
