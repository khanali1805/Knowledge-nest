import { eq } from "drizzle-orm";
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
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = articleIdSchema.safeParse(id);
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
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load the article.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = articleIdSchema.safeParse(id);
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
    const requestBody: unknown = await request.json();
    const parsedInput = articleUpdateSchema.safeParse(requestBody);
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
    const existingArticles = await db
      .select({
        id: articles.id,
        status: articles.status,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.id, parsedId.data))
      .limit(1);
    const existingArticle = existingArticles[0];
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
    const updateValues = {
      ...input,
      publishedAt,
      updatedAt: now,
    };
    const [updatedArticle] = await db
      .update(articles)
      .set(updateValues)
      .where(eq(articles.id, parsedId.data))
      .returning();
    return NextResponse.json({
      article: updatedArticle,
      message:
        updatedArticle.status === "published"
          ? "Article published successfully."
          : "Article updated successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the article.";
    const status =
      message.toLowerCase().includes("unique") ||
      message.toLowerCase().includes("duplicate")
        ? 409
        : 500;
    return NextResponse.json(
      {
        message:
          status === 409 ? "An article with this URL slug already exists." : message,
      },
      {
        status,
      },
    );
  }
}
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = articleIdSchema.safeParse(id);
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
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to delete the article.",
      },
      {
        status: 500,
      },
    );
  }
}
