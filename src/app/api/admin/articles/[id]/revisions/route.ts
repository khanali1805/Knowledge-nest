import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createArticleRevision,
  findArticleForRevision,
  listArticleRevisions,
} from "@/lib/article-revision-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
const snapshotSchema = z.object({
  title: z.string().max(255),
  slug: z.string().max(300),
  excerpt: z.string().max(500),
  content: z.string(),
  categoryId: z.string(),
  status: z.string().max(30),
  isFeatured: z.boolean(),
  seoTitle: z.string().max(255),
  seoDescription: z.string(),
  focusKeyword: z.string().max(255),
  tags: z.string(),
  featuredImageId: z.string(),
  readingTimeMinutes: z.number().int().min(1).max(1000),
});
const createRevisionSchema = z.object({
  snapshot: snapshotSchema,
  reason: z.enum(["autosave", "manual", "publish", "recovery"]).default("manual"),
  changeSummary: z.string().max(500).optional(),
});
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const article = await findArticleForRevision(id);
    if (!article) {
      return NextResponse.json(
        {
          message: "Article nahi mila.",
        },
        {
          status: 404,
        },
      );
    }
    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? "30");
    const revisions = await listArticleRevisions(
      id,
      Number.isFinite(requestedLimit) ? requestedLimit : 30,
    );
    return NextResponse.json({
      success: true,
      revisions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Server revisions load nahi huin.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Revision request valid JSON honi chahiye.",
        },
        {
          status: 400,
        },
      );
    }
    const parsed = createRevisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Revision validation failed.",
          errors: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const revision = await createArticleRevision({
      articleId: id,
      snapshot: parsed.data.snapshot,
      reason: parsed.data.reason,
      changeSummary: parsed.data.changeSummary,
    });
    return NextResponse.json(
      {
        success: true,
        message:
          parsed.data.reason === "autosave"
            ? "Server autosave complete."
            : "Server revision save ho gayi.",
        revision,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Server revision save nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
