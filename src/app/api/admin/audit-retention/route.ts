import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getAuditRetentionPolicy,
  runAuditRetentionCleanup,
  updateAuditRetentionPolicy,
} from "@/lib/article-notification-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const retentionInputSchema = z.object({
  isEnabled: z.boolean(),
  activityRetentionDays: z.number().int().min(1).max(3650),
  notificationRetentionDays: z.number().int().min(1).max(3650),
  revisionRetentionDays: z.number().int().min(1).max(3650),
});
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
    const policy = await getAuditRetentionPolicy();
    return NextResponse.json(
      {
        success: true,
        policy,
      },
      {
        headers: {
          "Cache-Control": "no-store",
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
            : "Audit retention policy load nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function PUT(request: Request) {
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
    const parsedInput = retentionInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Audit retention values valid nahi hain.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const policy = await updateAuditRetentionPolicy({
      username: session.username,
      ...parsedInput.data,
    });
    return NextResponse.json({
      success: true,
      policy,
      message: "Audit retention policy save ho gayi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Audit retention policy save nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
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
    const cleanup = await runAuditRetentionCleanup();
    return NextResponse.json({
      success: true,
      cleanup,
      message: cleanup.skipped
        ? "Audit retention disabled hai. Cleanup skip hui."
        : "Audit retention cleanup complete ho gayi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Audit retention cleanup nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
