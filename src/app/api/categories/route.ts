import { NextResponse } from "next/server";
import { getPublishedCategories } from "@/lib/queries/article-queries";
import {
  getRequestHeaders,
  getRequestId,
  getTemporaryFailureHeaders,
  logProductionEvent,
  withTimeout,
} from "@/lib/production-observability";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CATEGORIES_QUERY_TIMEOUT_MS = 5_000;
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const categories = await withTimeout(
      getPublishedCategories(),
      CATEGORIES_QUERY_TIMEOUT_MS,
    );
    logProductionEvent({
      level: "info",
      event: "public_categories_success",
      route: "/api/categories",
      requestId,
      status: 200,
      durationMilliseconds: Date.now() - startedAt,
      details: {
        resultCount: categories.length,
      },
    });
    return NextResponse.json(
      {
        categories,
      },
      {
        headers: getRequestHeaders(requestId),
      },
    );
  } catch (error) {
    logProductionEvent({
      level: "error",
      event: "public_categories_failure",
      route: "/api/categories",
      requestId,
      status: 503,
      durationMilliseconds: Date.now() - startedAt,
      error,
    });
    return NextResponse.json(
      {
        categories: [],
      },
      {
        status: 503,
        headers: getTemporaryFailureHeaders(requestId),
      },
    );
  }
}
