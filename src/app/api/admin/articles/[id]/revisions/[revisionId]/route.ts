import { NextResponse } from "next/server";
import {
  deleteArticleRevision,
  restoreArticleRevision,
} from "@/lib/article-revision-store";
import { revalidateArticlePublishingPaths } from "@/lib/article-publication-cache";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
    revisionId: string;
  }>;
};
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id, revisionId } = await context.params;
    const result = await restoreArticleRevision({
      articleId: id,
      revisionId,
    });
    revalidateArticlePublishingPaths();
    return NextResponse.json({
      success: true,
      message:
        "Selected server revision restore ho gayi. Article safety ke liye draft mode mein rakha gaya hai.",
      article: result.article,
      snapshot: result.snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Server revision restore nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, revisionId } = await context.params;
    const deleted = await deleteArticleRevision({
      articleId: id,
      revisionId,
    });
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Revision nahi mili.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Server revision delete ho gayi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Server revision delete nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
