import {
  getArticleExcerpt,
  getPublishedArticles,
  getPublishedCategories,
  type PublishedArticleRecord,
  type PublishedCategoryRecord,
} from "@/lib/queries/article-queries";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
export type GlobalHomepageContent = {
  siteName: string;
  tagline: string;
  articles: PublishedArticleRecord[];
  categories: PublishedCategoryRecord[];
};
export async function getGlobalHomepageContent(): Promise<GlobalHomepageContent> {
  const [settings, articles, categories] = await Promise.all([
    getPublicSiteSettings(),
    getPublishedArticles(500),
    getPublishedCategories(),
  ]);
  return {
    siteName: settings.siteName?.trim() || "Knowledge Nest",
    tagline:
      settings.tagline?.trim() ||
      "Useful knowledge, stories and information from every category.",
    articles,
    categories,
  };
}
export { getArticleExcerpt };
export type { PublishedArticleRecord, PublishedCategoryRecord };
