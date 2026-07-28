import { NextResponse } from "next/server";
import {
  getArticleExcerpt,
  searchPublishedArticles,
} from "@/lib/queries/article-queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json([]);
  }
  const articles = await searchPublishedArticles(query, 10);
  const results = articles.map((article) => ({
    title: article.title,
    slug: article.slug,
    excerpt: getArticleExcerpt(article),
    category: article.categoryName ?? "Articles",
  }));
  return NextResponse.json(results);
}
