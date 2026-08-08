import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { listSchedulerRuns } from "@/lib/notification-delivery-store";
import { runNotificationScheduler } from "@/lib/notification-scheduler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schedulerInputSchema = z.object({
  runAlertScan: z.boolean().default(true),
  runRetentionCleanup: z.boolean().default(true),
  deliveryLimit: z.number().int().min(1).max(100).default(50),
});
function schedulerSecretValid(request: Request): boolean {
  const configuredSecret = process.env.NOTIFICATION_SCHEDULER_SECRET?.trim();
  if (!configuredSecret) {
    return false;
  }
  const authorization = request.headers.get("authorization");
  const schedulerSecret = request.headers.get("x-notification-scheduler-secret");
  return (
    authorization === `Bearer ${configuredSecret}` || schedulerSecret === configuredSecret
  );
}
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
    const schedulerRuns = await listSchedulerRuns({
      limit: 50,
    });
    return NextResponse.json(
      {
        success: true,
        schedulerRuns,
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
          error instanceof Error ? error.message : "Scheduler history load nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    const secretAuthorised = schedulerSecretValid(request);
    if (!session && !secretAuthorised) {
      return NextResponse.json(
        {
          success: false,
          message: "Scheduler authentication required.",
        },
        {
          status: 401,
        },
      );
    }
    const recipientUsername =
      session?.username ??
      process.env.NOTIFICATION_SCHEDULER_RECIPIENT_USERNAME?.trim() ??
      "";
    if (!recipientUsername) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cron scheduler ke liye NOTIFICATION_SCHEDULER_RECIPIENT_USERNAME configured nahi hai.",
        },
        {
          status: 400,
        },
      );
    }
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsedInput = schedulerInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Scheduler input valid nahi hai.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    const result = await runNotificationScheduler({
      recipientUsername,
      trigger: session ? "api" : "cron",
      ...parsedInput.data,
    });
    return NextResponse.json(
      {
        success: result.status === "completed",
        result,
        message:
          result.status === "completed"
            ? "Notification scheduler run complete hua."
            : "Notification scheduler run fail hua.",
      },
      {
        status: result.status === "completed" ? 200 : 500,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Notification scheduler run nahi hua.",
      },
      {
        status: 500,
      },
    );
  }
}
