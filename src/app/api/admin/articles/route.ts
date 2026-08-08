import { desc, eq, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories, media } from "@/db/schema";
import { articleInputSchema } from "@/lib/articles/validation";
import { revalidateArticlePublishingPaths } from "@/lib/article-publication-cache";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type IncomingArticlePayload = Record<string, unknown> & {
  category?: unknown;
  categoryId?: unknown;
  featured?: unknown;
  isFeatured?: unknown;
  content?: unknown;
  readingTimeMinutes?: unknown;
};
class ArticleCategoryError extends Error {}
function decodeContentImageUrl(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}
function getLatestContentImageUrl(content: string): string {
  const matches = Array.from(content.matchAll(/<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi));
  if (matches.length === 0) {
    return "";
  }
  const latestMatch = matches[matches.length - 1];
  const rawUrl = latestMatch?.[2] ?? "";
  return decodeContentImageUrl(rawUrl);
}
async function resolveArticleFeaturedImageId(
  content: string,
  requestedFeaturedImageId: string | null | undefined,
): Promise<string | null> {
  const contentImageUrl = getLatestContentImageUrl(content);
  if (!contentImageUrl) {
    return requestedFeaturedImageId ?? null;
  }
  const [contentMedia] = await db
    .select({
      id: media.id,
    })
    .from(media)
    .where(eq(media.url, contentImageUrl))
    .limit(1);
  if (contentMedia?.id) {
    return contentMedia.id;
  }
  return requestedFeaturedImageId ?? null;
}
function calculateReadingTime(content: unknown): number {
  if (typeof content !== "string") {
    return 1;
  }
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / 220));
}
async function normaliseArticlePayload(
  requestBody: unknown,
): Promise<Record<string, unknown>> {
  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
    return {};
  }
  const payload = requestBody as IncomingArticlePayload;
  let categoryId =
    typeof payload.categoryId === "string" && payload.categoryId.trim()
      ? payload.categoryId.trim()
      : undefined;
  if (!categoryId && typeof payload.category === "string" && payload.category.trim()) {
    const categoryName = payload.category.trim();
    const [matchedCategory] = await db
      .select({
        id: categories.id,
      })
      .from(categories)
      .where(ilike(categories.name, categoryName))
      .limit(1);
    if (!matchedCategory) {
      throw new ArticleCategoryError(
        `The selected category "${categoryName}" does not exist in the database.`,
      );
    }
    categoryId = matchedCategory.id;
  }
  return {
    ...payload,
    categoryId,
    isFeatured:
      typeof payload.isFeatured === "boolean"
        ? payload.isFeatured
        : typeof payload.featured === "boolean"
          ? payload.featured
          : false,
    readingTimeMinutes:
      typeof payload.readingTimeMinutes === "number"
        ? payload.readingTimeMinutes
        : calculateReadingTime(payload.content),
  };
}
function createErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  if (error instanceof ArticleCategoryError) {
    return NextResponse.json(
      {
        message,
      },
      {
        status: 400,
      },
    );
  }
  const normalisedMessage = message.toLowerCase();
  const status =
    normalisedMessage.includes("unique") || normalisedMessage.includes("duplicate")
      ? 409
      : 500;
  return NextResponse.json(
    {
      message: status === 409 ? "An article with this URL slug already exists." : message,
    },
    {
      status,
    },
  );
}
export async function GET() {
  try {
    const articleRows = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        status: articles.status,
        isFeatured: articles.isFeatured,
        readingTimeMinutes: articles.readingTimeMinutes,
        viewCount: articles.viewCount,
        publishedAt: articles.publishedAt,
        scheduledAt: articles.scheduledAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        featuredImageId: media.id,
        featuredImageUrl: media.url,
        featuredImageAlt: media.altText,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .orderBy(desc(articles.updatedAt));
    return NextResponse.json({
      articles: articleRows,
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to load articles.");
  }
}
export async function POST(request: Request) {
  try {
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      // PHASE_10_ARTICLE_REVALIDATION
      revalidateArticlePublishingPaths();

      return NextResponse.json(
        {
          message: "The article request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }
    const normalisedInput = await normaliseArticlePayload(requestBody);
    const parsedInput = articleInputSchema.safeParse(normalisedInput);
    if (!parsedInput.success) {
      // PHASE_10_ARTICLE_REVALIDATION
      revalidateArticlePublishingPaths();

      return NextResponse.json(
        {
          message: "Article validation failed.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const input = parsedInput.data;
    const now = new Date();
    const publishedAt = input.status === "published" ? now : null;
    const resolvedFeaturedImageId = await resolveArticleFeaturedImageId(
      input.content,
      input.featuredImageId,
    );
    const [createdArticle] = await db
      .insert(articles)
      .values({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        categoryId: input.categoryId,
        featuredImageId: resolvedFeaturedImageId,
        status: input.status,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        canonicalUrl: input.canonicalUrl,
        focusKeyword: input.focusKeyword,
        readingTimeMinutes: input.readingTimeMinutes,
        isFeatured: input.isFeatured,
        scheduledAt: input.scheduledAt,
        publishedAt,
        updatedAt: now,
      })
      .returning();
    if (!createdArticle) {
      throw new Error("The article was not created.");
    }
    // PHASE_10_ARTICLE_REVALIDATION
    revalidateArticlePublishingPaths();

    return NextResponse.json(
      {
        article: createdArticle,
        message:
          createdArticle.status === "published"
            ? "Article published successfully."
            : "Draft saved successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return createErrorResponse(error, "Unable to create the article.");
  }
}
