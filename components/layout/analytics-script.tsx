import Script from "next/script";

import { hasAnalyticsEnv } from "@/lib/env";
import { env } from "@/lib/env";

export function AnalyticsScript() {
  if (!hasAnalyticsEnv || !env.client.gaMeasurementId) {
    return null;
  }

  const measurementId = env.client.gaMeasurementId;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
