import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, articleTags, categories, media, tags } from "@/db/schema";
import { articleInputSchema } from "@/lib/articles/validation";
import { revalidateArticlePublishingPaths } from "@/lib/article-publication-cache";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
class ArticleTagError extends Error {}
type NormalizedArticleTag = {
  name: string;
  slug: string;
};
function createArticleTagSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140)
    .replace(/-+$/g, "");
}
function normalizeArticleTags(inputTags: string[]): NormalizedArticleTag[] {
  const tagsBySlug = new Map<string, NormalizedArticleTag>();
  for (const inputTag of inputTags) {
    const name = inputTag.trim();
    if (!name) {
      continue;
    }
    const slug = createArticleTagSlug(name);
    if (!slug) {
      throw new ArticleTagError(`Tag "${name}" cannot produce a valid URL slug.`);
    }
    if (!tagsBySlug.has(slug)) {
      tagsBySlug.set(slug, {
        name,
        slug,
      });
    }
  }
  return Array.from(tagsBySlug.values());
}
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
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
    const articleTagRows = await db
      .select({
        name: tags.name,
      })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, id))
      .orderBy(asc(tags.name));
    return NextResponse.json({
      article: {
        ...article,
        tags: articleTagRows.map((tag) => tag.name),
      },
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
    const resolvedFeaturedImageId = await resolveArticleFeaturedImageId(
      input.content,
      input.featuredImageId,
    );
    // SEO_5B_ARTICLE_TAG_WIRING
    const normalizedTags = normalizeArticleTags(input.tags);
    const updatedArticle = await db.transaction(async (transaction) => {
      const [article] = await transaction
        .update(articles)
        .set({
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
        .where(eq(articles.id, id))
        .returning();
      if (!article) {
        throw new Error("Article update nahi hua.");
      }
      await transaction.delete(articleTags).where(eq(articleTags.articleId, id));
      for (const tagInput of normalizedTags) {
        const [existingTag] = await transaction
          .select({
            id: tags.id,
          })
          .from(tags)
          .where(eq(tags.slug, tagInput.slug))
          .limit(1);
        let tagId = existingTag?.id;
        if (!tagId) {
          const [insertedTag] = await transaction
            .insert(tags)
            .values({
              name: tagInput.name,
              slug: tagInput.slug,
              description: null,
            })
            .onConflictDoNothing({
              target: tags.slug,
            })
            .returning({
              id: tags.id,
            });
          tagId = insertedTag?.id;
          if (!tagId) {
            const [concurrentTag] = await transaction
              .select({
                id: tags.id,
              })
              .from(tags)
              .where(eq(tags.slug, tagInput.slug))
              .limit(1);
            tagId = concurrentTag?.id;
          }
        }
        if (!tagId) {
          throw new ArticleTagError(`Unable to resolve tag "${tagInput.name}".`);
        }
        await transaction
          .insert(articleTags)
          .values({
            articleId: id,
            tagId,
          })
          .onConflictDoNothing();
      }
      return article;
    });
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
      error instanceof ArticleTagError
        ? 400
        : normalisedMessage.includes("unique") || normalisedMessage.includes("duplicate")
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
