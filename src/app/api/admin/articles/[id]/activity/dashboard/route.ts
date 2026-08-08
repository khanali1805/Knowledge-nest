import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getArticleActivityDashboard } from "@/lib/article-collaboration-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
export async function GET(_request: Request, context: RouteContext) {
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
    const { id } = await context.params;
    const dashboard = await getArticleActivityDashboard(id);
    return NextResponse.json(
      {
        success: true,
        dashboard,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Article collaboration dashboard load nahi hua.",
      },
      {
        status: 500,
      },
    );
  }
}
