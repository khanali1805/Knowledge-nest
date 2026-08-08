import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getGlobalCollaborationDashboard } from "@/lib/article-collaboration-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
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
    const dashboard = await getGlobalCollaborationDashboard();
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
            : "Global collaboration dashboard load nahi hua.",
      },
      {
        status: 500,
      },
    );
  }
}
