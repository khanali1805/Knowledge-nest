import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  deleteAdminNotification,
  getUnreadNotificationCount,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/article-notification-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const updateInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mark-one"),
    notificationId: z.uuid(),
    isRead: z.boolean(),
  }),
  z.object({
    action: z.literal("mark-all"),
  }),
]);
const deleteInputSchema = z.object({
  notificationId: z.uuid(),
});
export async function GET(request: Request) {
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
    const requestUrl = new URL(request.url);
    const unreadOnly = requestUrl.searchParams.get("unreadOnly") === "true";
    const limitValue = Number(requestUrl.searchParams.get("limit") ?? "50");
    const [notifications, unreadCount] = await Promise.all([
      listAdminNotifications({
        username: session.username,
        unreadOnly,
        limit: Number.isFinite(limitValue) ? limitValue : 50,
      }),
      getUnreadNotificationCount(session.username),
    ]);
    return NextResponse.json(
      {
        success: true,
        notifications,
        unreadCount,
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
        message: error instanceof Error ? error.message : "Notifications load nahi huin.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function PATCH(request: Request) {
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
    const parsedInput = updateInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid notification update required hai.",
          errors: parsedInput.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }
    if (parsedInput.data.action === "mark-all") {
      const updatedCount = await markAllAdminNotificationsRead(session.username);
      return NextResponse.json({
        success: true,
        updatedCount,
        message: "Tamam notifications read mark ho gayi hain.",
      });
    }
    const notification = await markAdminNotificationRead({
      notificationId: parsedInput.data.notificationId,
      username: session.username,
      isRead: parsedInput.data.isRead,
    });
    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification nahi mili.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      success: true,
      notification,
      message: "Notification update ho gayi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Notification update nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function DELETE(request: Request) {
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
    const parsedInput = deleteInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid notification ID required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const deleted = await deleteAdminNotification({
      notificationId: parsedInput.data.notificationId,
      username: session.username,
    });
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification nahi mili.",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Notification delete ho gayi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Notification delete nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
