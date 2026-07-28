import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OrganizationJsonLd } from "@/components/site/seo/organization-json-ld";
import { WebsiteJsonLd } from "@/components/site/seo/website-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";
import { ActiveThemeStyle } from "@/components/site/active-theme-style";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const siteUrl = getSiteUrl();
const ogImage = `${siteUrl}/api/og?title=Knowledge%20Nest`;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Knowledge Nest",
    template: "%s | Knowledge Nest",
  },
  description:
    "Educational articles across finance, science, technology, health, education and other knowledge categories.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Knowledge Nest",
    title: "Knowledge Nest",
    description:
      "Educational articles across finance, science, technology, health, education and other knowledge categories.",
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
    title: "Knowledge Nest",
    description:
      "Educational articles across finance, science, technology, health, education and other knowledge categories.",
    images: [ogImage],
  },
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ActiveThemeStyle />
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );
}
