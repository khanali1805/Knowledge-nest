import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories, media } from "@/db/schema";
import { articleInputSchema } from "@/lib/articles/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load articles.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function POST(request: Request) {
  try {
    const requestBody: unknown = await request.json();
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
    const publishedAt = input.status === "published" ? now : null;
    const [createdArticle] = await db
      .insert(articles)
      .values({
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
      .returning();
    return NextResponse.json(
      {
        article: createdArticle,
        message:
          input.status === "published"
            ? "Article published successfully."
            : "Article saved successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the article.";
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
