import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, media } from "@/db/schema";
export type PublishedArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  readingTimeMinutes: number;
  isFeatured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};
export function createContentSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function createNicheCandidates(niche: string): string[] {
  const normalizedNiche = niche.trim().toLowerCase();
  const nicheSlug = createContentSlug(niche);
  const aliases: Record<string, string[]> = {
    ai: ["ai", "artificial intelligence", "artificial-intelligence", "technology"],
    automobile: ["automobile", "automotive", "cars", "car"],
    automotive: ["automotive", "automobile", "cars", "car"],
    cars: ["cars", "car", "automotive", "automobile"],
    education: ["education", "learning"],
    entertainment: ["entertainment", "movies", "television"],
    fashion: ["fashion", "style", "beauty"],
    finance: ["finance", "money", "business"],
    fitness: ["fitness", "health", "wellness"],
    food: ["food", "recipes", "cooking"],
    gaming: ["gaming", "games", "technology"],
    general: [],
    health: ["health", "wellness", "fitness"],
    lifestyle: ["lifestyle", "health", "fashion"],
    news: ["news", "world news", "latest news"],
    science: ["science", "research"],
    sports: ["sports", "fitness"],
    technology: ["technology", "tech", "artificial intelligence"],
    travel: ["travel", "tourism", "destinations"],
  };
  return Array.from(
    new Set(
      [normalizedNiche, nicheSlug, ...(aliases[normalizedNiche] ?? [])]
        .map((candidate) => candidate.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
export async function getPublishedArticlesForNiche(
  niche: string,
  limit = 24,
): Promise<PublishedArticleRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const nicheCandidates = createNicheCandidates(niche);
  if (nicheCandidates.length === 0) {
    return [];
  }
  try {
    const categoryConditions = nicheCandidates.flatMap((candidate) => [
      eq(categories.slug, createContentSlug(candidate)),
      eq(categories.name, candidate),
    ]);
    return await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        featuredImageId: media.id,
        featuredImageUrl: media.url,
        featuredImageAlt: media.altText,
        readingTimeMinutes: articles.readingTimeMinutes,
        isFeatured: articles.isFeatured,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(
        and(
          eq(articles.status, "published"),
          eq(categories.isActive, true),
          or(...categoryConditions),
        ),
      )
      .orderBy(
        desc(articles.isFeatured),
        desc(articles.publishedAt),
        desc(articles.updatedAt),
      )
      .limit(safeLimit);
  } catch {
    return [];
  }
}
export async function getPublishedArticleBySlug(
  slug: string,
): Promise<PublishedArticleRecord | null> {
  try {
    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        featuredImageId: media.id,
        featuredImageUrl: media.url,
        featuredImageAlt: media.altText,
        readingTimeMinutes: articles.readingTimeMinutes,
        isFeatured: articles.isFeatured,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .limit(1);
    return article ?? null;
  } catch {
    return null;
  }
}
