import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { generateCollaborationAlerts } from "@/lib/article-notification-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST() {
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
    const result = await generateCollaborationAlerts(session.username);
    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.created > 0
          ? `${result.created} new collaboration alerts create hui hain.`
          : "Koi new collaboration alert nahi mili.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Collaboration alerts scan nahi huin.",
      },
      {
        status: 500,
      },
    );
  }
}
