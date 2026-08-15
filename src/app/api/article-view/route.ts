import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
export const runtime = "nodejs";
type ArticleViewPayload = {
  slug?: unknown;
};
function createResponse(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function normalizeHostname(hostname: string): string {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") {
    return "loopback";
  }
  return normalized;
}
function normalizePort(protocol: string, port: string): string {
  if (port) {
    return port;
  }
  return protocol === "https:" ? "443" : "80";
}
function originsMatch(requestOrigin: URL, suppliedOrigin: URL): boolean {
  const requestProtocol = requestOrigin.protocol.toLowerCase();
  const suppliedProtocol = suppliedOrigin.protocol.toLowerCase();
  if (requestProtocol !== suppliedProtocol) {
    return false;
  }
  if (
    normalizeHostname(requestOrigin.hostname) !==
    normalizeHostname(suppliedOrigin.hostname)
  ) {
    return false;
  }
  return (
    normalizePort(requestProtocol, requestOrigin.port) ===
    normalizePort(suppliedProtocol, suppliedOrigin.port)
  );
}
function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") {
    return false;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return fetchSite === "same-origin" || fetchSite === "same-site";
  }
  if (origin.trim().toLowerCase() === "null") {
    return false;
  }
  try {
    return originsMatch(new URL(request.url), new URL(origin));
  } catch {
    return false;
  }
}
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return createResponse(
      {
        success: false,
        message: "Invalid request origin.",
      },
      403,
    );
  }
  let payload: ArticleViewPayload;
  try {
    payload = (await request.json()) as ArticleViewPayload;
  } catch {
    return createResponse(
      {
        success: false,
        message: "Invalid JSON body.",
      },
      400,
    );
  }
  const slug = typeof payload.slug === "string" ? payload.slug.trim().toLowerCase() : "";
  if (!slug || slug.length > 300 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return createResponse(
      {
        success: false,
        message: "Invalid article slug.",
      },
      400,
    );
  }
  try {
    const updatedRows = await db
      .update(articles)
      .set({
        viewCount: sql`${articles.viewCount} + 1`,
      })
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .returning({
        id: articles.id,
      });
    if (updatedRows.length === 0) {
      return createResponse(
        {
          success: false,
          message: "Published article not found.",
        },
        404,
      );
    }
    return createResponse({
      success: true,
    });
  } catch {
    return createResponse(
      {
        success: false,
        message: "Article view could not be recorded.",
      },
      500,
    );
  }
}
