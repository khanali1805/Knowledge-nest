import { getSiteUrl } from "@/lib/site-url";
export type BloggingArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  readingTimeMinutes: number;
  isFeatured: boolean;
  publishedAt: string | null;
  updatedAt: string;
};
export type BloggingCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};
export type BloggingOverview = {
  featured: BloggingArticle[];
  latest: BloggingArticle[];
  trending: BloggingArticle[];
  popular: BloggingArticle[];
  categories: BloggingCategory[];
  generatedAt: string;
};
export function createArticleUrl(slug: string): string {
  return `/article/${encodeURIComponent(slug)}`;
}
export function createCategoryUrl(slug: string): string {
  return `/category/${encodeURIComponent(slug)}`;
}
export function formatArticleDate(value: string | null): string {
  if (!value) {
    return "Recently updated";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
export function createWebsiteStructuredData() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Knowledge Nest",
    alternateName: ["KnowledgeNest", "Knowledge Nest Website"],
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
export function createArticleListStructuredData(articles: BloggingArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: createArticleUrl(article.slug),
      name: article.title,
    })),
  };
}
