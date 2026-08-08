import { MASTER_CATEGORIES } from "@/lib/categories";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
export type SiteCategoryLink = {
  name: string;
  slug: string;
  href: string;
};
export type SiteShellLayout = {
  websiteName: string;
  logoUrl: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  backgroundColour: string;
  textColour: string;
  headingFont: string;
  bodyFont: string;
  categories: SiteCategoryLink[];
};
export async function getSiteShellLayout(): Promise<SiteShellLayout> {
  const settings = await getPublicSiteSettings();
  return {
    websiteName: settings.siteName?.trim() || "Knowledge Nest",
    logoUrl: "",
    primaryColour: "#0f172a",
    secondaryColour: "#334155",
    accentColour: "#2563eb",
    backgroundColour: "#ffffff",
    textColour: "#0f172a",
    headingFont: "Arial, Helvetica, sans-serif",
    bodyFont: "Arial, Helvetica, sans-serif",
    categories: MASTER_CATEGORIES.map((category) => ({
      name: category.name,
      slug: category.slug,
      href: `/category/${category.slug}`,
    })),
  };
}
