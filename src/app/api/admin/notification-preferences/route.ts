import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notification-delivery-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const timeValueSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const preferencesInputSchema = z.object({
  inAppEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  webhookEnabled: z.boolean(),
  emailAddress: z
    .union([z.string().email().max(320), z.literal(""), z.null()])
    .optional(),
  webhookUrl: z.union([z.string().url().max(2048), z.literal(""), z.null()]).optional(),
  minimumSeverity: z.enum(["info", "success", "warning", "critical"]),
  collaborationAlerts: z.boolean(),
  criticalActivityAlerts: z.boolean(),
  multipleEditorAlerts: z.boolean(),
  retentionAlerts: z.boolean(),
  digestEnabled: z.boolean(),
  digestIntervalMinutes: z.number().int().min(5).max(10_080),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: timeValueSchema,
  quietHoursEnd: timeValueSchema,
  timezone: z.string().trim().min(1).max(80),
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
    const preferences = await getNotificationPreferences(session.username);
    return NextResponse.json(
      {
        success: true,
        preferences,
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
            : "Notification preferences load nahi huin.",
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
    const parsedInput = preferencesInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification preference values valid nahi hain.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    if (parsedInput.data.emailEnabled && !parsedInput.data.emailAddress) {
      return NextResponse.json(
        {
          success: false,
          message: "Email delivery enable karne ke liye email address required hai.",
        },
        {
          status: 400,
        },
      );
    }
    if (parsedInput.data.webhookEnabled && !parsedInput.data.webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Webhook delivery enable karne ke liye webhook URL required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const preferences = await updateNotificationPreferences({
      username: session.username,
      ...parsedInput.data,
    });
    return NextResponse.json({
      success: true,
      preferences,
      message: "Notification preferences save ho gayi hain.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Notification preferences save nahi huin.",
      },
      {
        status: 500,
      },
    );
  }
}
