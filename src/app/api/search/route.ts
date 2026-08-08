import { NextResponse } from "next/server";
import {
  getArticleExcerpt,
  searchPublishedArticles,
} from "@/lib/queries/article-queries";
import {
  getRequestHeaders,
  getRequestId,
  getTemporaryFailureHeaders,
  logProductionEvent,
  withTimeout,
} from "@/lib/production-observability";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SEARCH_QUERY_TIMEOUT_MS = 5_000;
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json([], {
      headers: getRequestHeaders(requestId),
    });
  }
  try {
    const articles = await withTimeout(
      searchPublishedArticles(query, 10),
      SEARCH_QUERY_TIMEOUT_MS,
    );
    const results = articles.map((article) => ({
      title: article.title,
      slug: article.slug,
      excerpt: getArticleExcerpt(article),
      category: article.categoryName ?? "Articles",
    }));
    logProductionEvent({
      level: "info",
      event: "public_search_success",
      route: "/api/search",
      requestId,
      status: 200,
      durationMilliseconds: Date.now() - startedAt,
      details: {
        resultCount: results.length,
      },
    });
    return NextResponse.json(results, {
      headers: getRequestHeaders(requestId),
    });
  } catch (error) {
    logProductionEvent({
      level: "error",
      event: "public_search_failure",
      route: "/api/search",
      requestId,
      status: 503,
      durationMilliseconds: Date.now() - startedAt,
      error,
    });
    return NextResponse.json([], {
      status: 503,
      headers: getTemporaryFailureHeaders(requestId),
    });
  }
}
