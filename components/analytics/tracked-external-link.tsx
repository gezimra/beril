"use client";

import type { ReactNode } from "react";

import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

interface TrackedExternalLinkProps<T extends AnalyticsEventName> {
  href: string;
  eventName: T;
  payload: AnalyticsEventPayload<T>;
  children: ReactNode;
  className?: string;
  target?: "_blank" | "_self";
  rel?: string;
}

export function TrackedExternalLink<T extends AnalyticsEventName>({
  href,
  eventName,
  payload,
  children,
  className,
  target = "_blank",
  rel = "noreferrer",
}: TrackedExternalLinkProps<T>) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => trackEvent(eventName, payload)}
    >
      {children}
    </a>
  );
}
