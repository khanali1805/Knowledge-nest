import { eq, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articles, categories, media } from "@/db/schema";
import { articleUpdateSchema } from "@/lib/articles/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const articleIdSchema = z.uuid();
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
type IncomingArticlePayload = Record<string, unknown> & {
  category?: unknown;
  categoryId?: unknown;
  featured?: unknown;
  isFeatured?: unknown;
  content?: unknown;
  readingTimeMinutes?: unknown;
};
class ArticleCategoryError extends Error {}
function calculateReadingTime(content: unknown): number | undefined {
  if (typeof content !== "string") {
    return undefined;
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
  const calculatedReadingTime = calculateReadingTime(payload.content);
  return {
    ...payload,
    ...(categoryId ? { categoryId } : {}),
    ...(typeof payload.isFeatured === "boolean"
      ? { isFeatured: payload.isFeatured }
      : typeof payload.featured === "boolean"
        ? { isFeatured: payload.featured }
        : {}),
    ...(typeof payload.readingTimeMinutes === "number"
      ? { readingTimeMinutes: payload.readingTimeMinutes }
      : calculatedReadingTime
        ? { readingTimeMinutes: calculatedReadingTime }
        : {}),
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
async function parseArticleId(context: RouteContext) {
  const { id } = await context.params;
  return articleIdSchema.safeParse(id);
}
export async function GET(_request: Request, context: RouteContext) {
  try {
    const parsedId = await parseArticleId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid article ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    const [article] = await db
      .select({
        id: articles.id,
        authorId: articles.authorId,
        categoryId: articles.categoryId,
        featuredImageId: articles.featuredImageId,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        status: articles.status,
        seoTitle: articles.seoTitle,
        seoDescription: articles.seoDescription,
        canonicalUrl: articles.canonicalUrl,
        focusKeyword: articles.focusKeyword,
        readingTimeMinutes: articles.readingTimeMinutes,
        viewCount: articles.viewCount,
        isFeatured: articles.isFeatured,
        scheduledAt: articles.scheduledAt,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        categoryName: categories.name,
        featuredImageUrl: media.url,
        featuredImageAlt: media.altText,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.featuredImageId, media.id))
      .where(eq(articles.id, parsedId.data))
      .limit(1);
    if (!article) {
      return NextResponse.json(
        {
          message: "Article not found.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      article,
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to load the article.");
  }
}
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const parsedId = await parseArticleId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid article ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
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
    const parsedInput = articleUpdateSchema.safeParse(normalisedInput);
    if (!parsedInput.success) {
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
    const [existingArticle] = await db
      .select({
        id: articles.id,
        status: articles.status,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.id, parsedId.data))
      .limit(1);
    if (!existingArticle) {
      return NextResponse.json(
        {
          message: "Article not found.",
        },
        {
          status: 404,
        },
      );
    }
    const input = parsedInput.data;
    const now = new Date();
    const publishedAt =
      input.status === "published" && !existingArticle.publishedAt
        ? now
        : input.status && input.status !== "published"
          ? null
          : existingArticle.publishedAt;
    const [updatedArticle] = await db
      .update(articles)
      .set({
        ...input,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(articles.id, parsedId.data))
      .returning();
    if (!updatedArticle) {
      throw new Error("The article was not updated.");
    }
    return NextResponse.json({
      article: updatedArticle,
      message:
        updatedArticle.status === "published"
          ? "Article published successfully."
          : "Draft saved successfully.",
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to update the article.");
  }
}
export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const parsedId = await parseArticleId(context);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          message: "A valid article ID is required.",
        },
        {
          status: 400,
        },
      );
    }
    const [deletedArticle] = await db
      .delete(articles)
      .where(eq(articles.id, parsedId.data))
      .returning({
        id: articles.id,
      });
    if (!deletedArticle) {
      return NextResponse.json(
        {
          message: "Article not found.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      message: "Article deleted successfully.",
    });
  } catch (error) {
    return createErrorResponse(error, "Unable to delete the article.");
  }
}
