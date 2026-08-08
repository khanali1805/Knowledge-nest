import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ActiveDesignCode } from "@/components/site/active-design-code";
import { OrganizationJsonLd } from "@/components/site/seo/organization-json-ld";
import { WebsiteJsonLd } from "@/components/site/seo/website-json-ld";
import { getGoogleAdsenseClientId } from "@/lib/adsense";
import { getActiveDesignCode } from "@/lib/design-code/store";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
import "./globals.css";
const REQUEST_PATHNAME_HEADER = "x-knowledge-nest-request-pathname";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
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
      icon: "/icon.svg",
    },
    manifest: "/manifest.webmanifest",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
      </body>
    </html>
  );
}
