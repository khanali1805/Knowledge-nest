import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { ActiveDesignCode } from "@/components/site/active-design-code";
import { OrganizationJsonLd } from "@/components/site/seo/organization-json-ld";
import { WebsiteJsonLd } from "@/components/site/seo/website-json-ld";
import { getGoogleAdsenseClientId } from "@/lib/adsense";
import { getActiveDesignCode } from "@/lib/design-code/store";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
import "./globals.css";
const REQUEST_PATHNAME_HEADER = "x-knowledge-nest-request-pathname";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const adsenseClientId = getGoogleAdsenseClientId();
  const ogImage = `${settings.siteUrl}/api/og?title=${encodeURIComponent(
    settings.siteName,
  )}`;
  return {
    metadataBase: new URL(settings.siteUrl),
    title: {
      default: settings.siteName,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.tagline,
    applicationName: settings.siteName,
    alternates: {
      canonical: "/",
    },
    category: "education",
    creator: settings.siteName,
    publisher: settings.siteName,
    robots: {
      index: settings.indexSite,
      follow: settings.indexSite,
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: settings.siteName,
      title: settings.siteName,
      description: settings.tagline,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description: settings.tagline,
      images: [ogImage],
    },
    icons: {
      icon: [
        {
          url: "/favicon.ico",
          type: "image/x-icon",
        },
        {
          url: "/brand/knowledge-nest-icon-64.png",
          type: "image/png",
          sizes: "64x64",
        },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    manifest: "/manifest.webmanifest",
    ...(adsenseClientId
      ? {
          other: {
            "google-adsense-account": adsenseClientId,
          },
        }
      : {}),
  };
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get(REQUEST_PATHNAME_HEADER) ?? "";
  const isAdminRequest = pathname === "/admin" || pathname.startsWith("/admin/");
  const [settings, activeDesignCode] = await Promise.all([
    getPublicSiteSettings(),
    isAdminRequest ? Promise.resolve("") : getActiveDesignCode(),
  ]);
  const adsenseClientId = isAdminRequest ? null : getGoogleAdsenseClientId();
  return (
    <html lang={settings.language}>
      <body className="antialiased">
        {adsenseClientId ? (
          <Script
            id="google-adsense-loader"
            strategy="afterInteractive"
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
              adsenseClientId,
            )}`}
          />
        ) : null}
        <WebsiteJsonLd settings={settings} />
        <OrganizationJsonLd settings={settings} />
        {!isAdminRequest && activeDesignCode ? (
          <ActiveDesignCode code={activeDesignCode} />
        ) : null}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
