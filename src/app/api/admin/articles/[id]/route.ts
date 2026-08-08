import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories, media } from "@/db/schema";
import { articleInputSchema } from "@/lib/articles/validation";
import { revalidateArticlePublishingPaths } from "@/lib/article-publication-cache";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        status: articles.status,
        isFeatured: articles.isFeatured,
        readingTimeMinutes: articles.readingTimeMinutes,
        seoTitle: articles.seoTitle,
        seoDescription: articles.seoDescription,
        focusKeyword: articles.focusKeyword,
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
      .where(eq(articles.id, id))
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
        message: error instanceof Error ? error.message : "Article load nahi hua.",
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
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          message: "Article request valid JSON honi chahiye.",
        },
        {
          status: 400,
        },
      );
    }
    const expectedUpdatedAt =
      requestBody &&
      typeof requestBody === "object" &&
      "expectedUpdatedAt" in requestBody &&
      typeof requestBody.expectedUpdatedAt === "string"
        ? requestBody.expectedUpdatedAt
        : "";
    const parsedInput = articleInputSchema.safeParse(requestBody);
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
    const input = parsedInput.data;
    const now = new Date();
    const [existingArticle] = await db
      .select({
        id: articles.id,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(eq(articles.id, id))
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
    if (
      expectedUpdatedAt &&
      existingArticle.updatedAt.toISOString() !== expectedUpdatedAt
    ) {
      return NextResponse.json(
        {
          success: false,
          conflict: true,
          message:
            "Article kisi doosre session mein update ho chuka hai. Page refresh karke latest version review karein.",
          serverUpdatedAt: existingArticle.updatedAt.toISOString(),
        },
        {
          status: 409,
        },
      );
    }
    const publishedAt =
      input.status === "published" ? (existingArticle.publishedAt ?? now) : null;
    const [updatedArticle] = await db
      .update(articles)
      .set({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        categoryId: input.categoryId,
        featuredImageId: input.featuredImageId,
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
      .where(eq(articles.id, id))
      .returning();
    if (!updatedArticle) {
      throw new Error("Article update nahi hua.");
    }
    revalidateArticlePublishingPaths();
    return NextResponse.json({
      article: updatedArticle,
      message:
        updatedArticle.status === "published"
          ? "Article publish ho gaya."
          : "Article draft update ho gaya.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Article update nahi hua.";
    const normalisedMessage = message.toLowerCase();
    const status =
      normalisedMessage.includes("unique") || normalisedMessage.includes("duplicate")
        ? 409
        : 500;
    return NextResponse.json(
      {
        message:
          status === 409 ? "Is slug ke sath article pehle se mojood hai." : message,
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
    const [deletedArticle] = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
      });
    if (!deletedArticle) {
      return NextResponse.json(
        {
          success: false,
          message: "Article not found.",
        },
        {
          status: 404,
        },
      );
    }
    revalidateArticlePublishingPaths();
    return NextResponse.json({
      success: true,
      article: deletedArticle,
      message: "Article permanently delete ho gaya.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Article delete nahi hua.",
      },
      {
        status: 500,
      },
    );
  }
}
