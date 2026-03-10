import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";

import { AnalyticsScript } from "@/components/layout/analytics-script";
import { AppProviders } from "@/components/layout/app-providers";
import { env } from "@/lib/env";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const metadataBase = (() => {
  try {
    return new URL(env.client.siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "BERIL | Ora dhe Syze ne Gjilan",
    template: "%s | BERIL",
  },
  description: siteConfig.description,
  applicationName: "BERIL",
  keywords: [
    "watches gjilan",
    "watch repair gjilan",
    "eyewear gjilan",
    "optical service gjilan",
    "BERIL gjilan",
  ],
  openGraph: {
    type: "website",
    title: "BERIL | Watches, Eyewear, Service",
    description: siteConfig.description,
    siteName: "BERIL",
    url: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq">
      <body className={`${geistSans.variable} ${cormorant.variable} antialiased`}>
        <a href="#main-content" className="skip-link">
          Kalo te permbajtja kryesore
        </a>
        <AppProviders>{children}</AppProviders>
        <AnalyticsScript />
      </body>
    </html>
  );
}
