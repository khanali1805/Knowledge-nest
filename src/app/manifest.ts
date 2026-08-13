import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
export const dynamic = "force-dynamic";
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSiteSettings();
  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description: settings.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/brand/knowledge-nest-mark-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
