import type { Metadata } from "next";
import { DynamicHomepage } from "@/components/site/dynamic-homepage";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
import { getActiveTheme } from "@/lib/theme/theme-store";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const [settings, theme] = await Promise.all([
    getPublicSiteSettings(),
    getActiveTheme(),
  ]);
  const description =
    settings.tagline ||
    `Explore the latest ${theme.niche} articles, guides and updates on ${settings.siteName}.`;
  return {
    title: settings.siteName,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: settings.siteName,
      title: settings.siteName,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(settings.siteName)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description,
      images: [`/api/og?title=${encodeURIComponent(settings.siteName)}`],
    },
  };
}
export default function HomePage() {
  return <DynamicHomepage />;
}
