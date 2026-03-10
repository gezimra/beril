"use client";

import { useEffect } from "react";

import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

interface EventOnViewProps<T extends AnalyticsEventName> {
  name: T;
  payload: AnalyticsEventPayload<T>;
}

export function EventOnView<T extends AnalyticsEventName>({
  name,
  payload,
}: EventOnViewProps<T>) {
  useEffect(() => {
    trackEvent(name, payload);
  }, [name, payload]);

  return null;
}
