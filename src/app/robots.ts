import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSiteSettings();
  if (!settings.indexSite) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: `${settings.siteUrl}/sitemap.xml`,
      host: settings.siteUrl,
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api", "/api/", "/search", "/search/"],
      },
    ],
    sitemap: `${settings.siteUrl}/sitemap.xml`,
    host: settings.siteUrl,
  };
}
