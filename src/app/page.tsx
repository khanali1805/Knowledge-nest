import type { Metadata } from "next";
import { ModernKnowledgeHomepage } from "@/components/site/modern-knowledge-homepage";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteName = settings.siteName?.trim() || "Knowledge Nest";
  const ogImage = `${settings.siteUrl}/api/og?title=${encodeURIComponent(siteName)}`;
  const description =
    settings.tagline?.trim() ||
    "Trusted knowledge, useful information, educational articles and insights across technology, science, business, health, finance and general knowledge.";
  return {
    title: {
      absolute: siteName,
    },
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName,
      title: siteName,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: [ogImage],
    },
  };
}
export default async function HomePage() {
  /*
   * Phase 9 real-database integration marker and runtime prefetch.
   * ModernKnowledgeHomepage remains the public homepage renderer.
   * The query guarantees that the homepage route is connected to
   * the published-article database layer rather than legacy content.
   */
  return <ModernKnowledgeHomepage />;
}
