import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createArticleActivity,
  listArticleActivities,
} from "@/lib/article-collaboration-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
const activityInputSchema = z.object({
  action: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(1000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export async function GET(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Admin authentication required.",
      },
      {
        status: 401,
      },
    );
  }
  const { id } = await context.params;
  const requestUrl = new URL(request.url);
  const limitValue = Number(requestUrl.searchParams.get("limit") ?? "50");
  const activities = await listArticleActivities({
    articleId: id,
    limit: Number.isFinite(limitValue) ? limitValue : 50,
  });
  return NextResponse.json({
    success: true,
    activities,
  });
}
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin authentication required.",
        },
        {
          status: 401,
        },
      );
    }
    const body: unknown = await request.json();
    const parsedInput = activityInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid activity data required hai.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const { id } = await context.params;
    const activity = await createArticleActivity({
      articleId: id,
      username: session.username,
      action: parsedInput.data.action,
      summary: parsedInput.data.summary,
      metadata: parsedInput.data.metadata,
    });
    return NextResponse.json(
      {
        success: true,
        activity,
        message: "Article activity log save ho gaya.",
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
          error instanceof Error ? error.message : "Article activity log save nahi hua.",
      },
      {
        status: 500,
      },
    );
  }
}
