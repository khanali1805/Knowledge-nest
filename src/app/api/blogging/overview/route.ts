import { NextResponse } from "next/server";
import {
  getPublishedArticles,
  getPublishedCategories,
} from "@/lib/queries/article-queries";
export const dynamic = "force-dynamic";
function serializeDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}
export async function GET() {
  try {
    const [articles, categories] = await Promise.all([
      getPublishedArticles(48),
      getPublishedCategories(),
    ]);
    const serializedArticles = articles.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      categoryName: article.categoryName,
      categorySlug: article.categorySlug,
      featuredImageUrl: article.featuredImageUrl,
      featuredImageAlt: article.featuredImageAlt,
      readingTimeMinutes: article.readingTimeMinutes,
      isFeatured: article.isFeatured,
      publishedAt: serializeDate(article.publishedAt),
      updatedAt: article.updatedAt.toISOString(),
    }));
    const featured = serializedArticles
      .filter((article) => article.isFeatured)
      .slice(0, 6);
    const latest = [...serializedArticles]
      .sort((left, right) => {
        const leftDate = new Date(left.publishedAt ?? left.updatedAt).getTime();
        const rightDate = new Date(right.publishedAt ?? right.updatedAt).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 8);
    const trendingSource = [...featured, ...latest, ...serializedArticles];
    const uniqueTrending = Array.from(
      new Map(trendingSource.map((article) => [article.id, article])).values(),
    ).slice(0, 6);
    const categoryCounts = new Map<string, number>();
    for (const article of serializedArticles) {
      if (!article.categorySlug) {
        continue;
      }
      categoryCounts.set(
        article.categorySlug,
        (categoryCounts.get(article.categorySlug) ?? 0) + 1,
      );
    }
    const popular = [...serializedArticles]
      .sort((left, right) => {
        const leftScore =
          (left.isFeatured ? 100 : 0) +
          (left.categorySlug ? (categoryCounts.get(left.categorySlug) ?? 0) : 0);
        const rightScore =
          (right.isFeatured ? 100 : 0) +
          (right.categorySlug ? (categoryCounts.get(right.categorySlug) ?? 0) : 0);
        return rightScore - leftScore;
      })
      .slice(0, 6);
    return NextResponse.json(
      {
        featured: featured.length > 0 ? featured : latest.slice(0, 4),
        latest,
        trending: uniqueTrending,
        popular,
        categories: categories.slice(0, 12),
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        featured: [],
        latest: [],
        trending: [],
        popular: [],
        categories: [],
        generatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
