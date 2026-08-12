import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
export const dynamic = "force-dynamic";
export default async function browserconfig(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSiteSettings();
  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description: settings.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: `${settings.siteUrl}/brand/knowledge-nest-mark-512.png`,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
