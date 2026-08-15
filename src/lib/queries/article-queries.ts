import { cache } from "react";
import { and, count, desc, eq, exists, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, articleTags, categories, media, tags } from "@/db/schema";
export type PublishedCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};
export type PublishedArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  focusKeyword: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  readingTimeMinutes: number;
  viewCount: number;
  isFeatured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};
export type PaginatedPublishedArticles = {
  articles: PublishedArticleRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
const publishedArticleSelection = {
  id: articles.id,
  title: articles.title,
  slug: articles.slug,
  excerpt: articles.excerpt,
  content: articles.content,
  seoTitle: articles.seoTitle,
  seoDescription: articles.seoDescription,
  canonicalUrl: articles.canonicalUrl,
  focusKeyword: articles.focusKeyword,
  categoryId: categories.id,
  categoryName: categories.name,
  categorySlug: categories.slug,
  featuredImageId: media.id,
  featuredImageUrl: media.url,
  featuredImageAlt: media.altText,
  readingTimeMinutes: articles.readingTimeMinutes,
  viewCount: articles.viewCount,
  isFeatured: articles.isFeatured,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
};
function normalizePage(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }
  return value;
}
function normalizePageSize(value: number): number {
  if (!Number.isInteger(value)) {
    return 12;
  }
  return Math.max(1, Math.min(value, 100));
}
function createPaginationResult(
  paginatedArticles: PublishedArticleRecord[],
  total: number,
  requestedPage: number,
  requestedPageSize: number,
): PaginatedPublishedArticles {
  const pageSize = normalizePageSize(requestedPageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(normalizePage(requestedPage), totalPages);
  return {
    articles: paginatedArticles,
    total,
    page,
    pageSize,
    totalPages,
  };
}
export function createContentSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
export function getArticleExcerpt(article: PublishedArticleRecord): string {
  const excerpt = article.excerpt?.trim();
  if (excerpt) {
    return excerpt;
  }
  const cleanContent = article.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleanContent) {
    return "Read the complete article for more information.";
  }
  return cleanContent.length > 180
    ? `${cleanContent.slice(0, 177).trimEnd()}...`
    : cleanContent;
}
function createCategoryCandidates(category: string): string[] {
  const normalizedCategory = category.trim().toLowerCase();
  const categorySlug = createContentSlug(category);
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
      [normalizedCategory, categorySlug, ...(aliases[normalizedCategory] ?? [])]
        .map((candidate) => candidate.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
async function getPublishedArticlesUncached(
  limit = 100,
): Promise<PublishedArticleRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  try {
    return await db
      .select(publishedArticleSelection)
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(eq(articles.status, "published"))
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
export const getPublishedArticles = cache(getPublishedArticlesUncached);
export async function getPopularPublishedArticles(
  limit = 12,
): Promise<PublishedArticleRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  try {
    return await db
      .select(publishedArticleSelection)
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(eq(articles.status, "published"))
      .orderBy(
        desc(articles.viewCount),
        desc(articles.isFeatured),
        desc(articles.publishedAt),
        desc(articles.updatedAt),
      )
      .limit(safeLimit);
  } catch {
    return [];
  }
}
export async function getPublishedArticlesForCategory(
  category: string,
  limit = 24,
): Promise<PublishedArticleRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const categoryCandidates = createCategoryCandidates(category);
  if (categoryCandidates.length === 0) {
    return [];
  }
  try {
    const categoryConditions = categoryCandidates.flatMap((candidate) => [
      eq(categories.slug, createContentSlug(candidate)),
      ilike(categories.name, candidate),
    ]);
    return await db
      .select(publishedArticleSelection)
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
      .select(publishedArticleSelection)
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
export async function getPublishedCategories(): Promise<PublishedCategoryRecord[]> {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder, categories.name);
  } catch {
    return [];
  }
}
export async function getPublishedCategoryBySlug(
  slug: string,
): Promise<PublishedCategoryRecord | null> {
  try {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
      .limit(1);
    return category ?? null;
  } catch {
    return null;
  }
}
export async function getPublishedArticlesByCategory(
  categoryId: string,
  limit = 100,
): Promise<PublishedArticleRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  try {
    return await db
      .select(publishedArticleSelection)
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(
        and(
          eq(articles.status, "published"),
          eq(articles.categoryId, categoryId),
          eq(categories.isActive, true),
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
export async function getPaginatedPublishedArticlesByCategory(
  categoryId: string,
  page = 1,
  pageSize = 12,
): Promise<PaginatedPublishedArticles> {
  const safePage = normalizePage(page);
  const safePageSize = normalizePageSize(pageSize);
  try {
    const conditions = and(
      eq(articles.status, "published"),
      eq(articles.categoryId, categoryId),
      eq(categories.isActive, true),
    );
    const [countRow] = await db
      .select({
        total: count(articles.id),
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(conditions);
    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const resolvedPage = Math.min(safePage, totalPages);
    const offset = (resolvedPage - 1) * safePageSize;
    const paginatedArticles = await db
      .select(publishedArticleSelection)
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(conditions)
      .orderBy(
        desc(articles.isFeatured),
        desc(articles.publishedAt),
        desc(articles.updatedAt),
      )
      .limit(safePageSize)
      .offset(offset);
    return createPaginationResult(paginatedArticles, total, resolvedPage, safePageSize);
  } catch {
    return createPaginationResult([], 0, 1, safePageSize);
  }
}
export async function searchPublishedArticles(
  query: string,
  limit = 50,
): Promise<PublishedArticleRecord[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const pattern = `%${normalizedQuery}%`;

  try {
    return await db
      .select(publishedArticleSelection)
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(
        and(
          eq(articles.status, "published"),
          or(
            ilike(articles.title, pattern),
            ilike(articles.excerpt, pattern),
            ilike(articles.content, pattern),
            ilike(articles.focusKeyword, pattern),
            ilike(categories.name, pattern),
            exists(
              db
                .select({
                  articleId: articleTags.articleId,
                })
                .from(articleTags)
                .innerJoin(tags, eq(articleTags.tagId, tags.id))
                .where(
                  and(eq(articleTags.articleId, articles.id), ilike(tags.name, pattern)),
                ),
            ),
          ),
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
export async function searchPaginatedPublishedArticles(
  query: string,
  page = 1,
  pageSize = 12,
): Promise<PaginatedPublishedArticles> {
  const normalizedQuery = query.trim();
  const safePage = normalizePage(page);
  const safePageSize = normalizePageSize(pageSize);

  if (!normalizedQuery) {
    return createPaginationResult([], 0, 1, safePageSize);
  }

  const pattern = `%${normalizedQuery}%`;

  try {
    const conditions = and(
      eq(articles.status, "published"),
      or(
        ilike(articles.title, pattern),
        ilike(articles.excerpt, pattern),
        ilike(articles.content, pattern),
        ilike(articles.focusKeyword, pattern),
        ilike(categories.name, pattern),
        exists(
          db
            .select({
              articleId: articleTags.articleId,
            })
            .from(articleTags)
            .innerJoin(tags, eq(articleTags.tagId, tags.id))
            .where(
              and(eq(articleTags.articleId, articles.id), ilike(tags.name, pattern)),
            ),
        ),
      ),
    );

    const [countRow] = await db
      .select({
        total: count(articles.id),
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(conditions);

    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const resolvedPage = Math.min(safePage, totalPages);
    const offset = (resolvedPage - 1) * safePageSize;

    const paginatedArticles = await db
      .select(publishedArticleSelection)
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(conditions)
      .orderBy(
        desc(articles.isFeatured),
        desc(articles.publishedAt),
        desc(articles.updatedAt),
      )
      .limit(safePageSize)
      .offset(offset);

    return createPaginationResult(paginatedArticles, total, resolvedPage, safePageSize);
  } catch {
    return createPaginationResult([], 0, 1, safePageSize);
  }
}
