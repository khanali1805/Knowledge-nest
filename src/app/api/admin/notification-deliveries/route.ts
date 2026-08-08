import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  listNotificationDeliveries,
  listSchedulerRuns,
  queueUndeliveredNotifications,
} from "@/lib/notification-delivery-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const querySchema = z.object({
  status: z.string().trim().max(30).optional(),
  channel: z.string().trim().max(30).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
const queueInputSchema = z.object({
  limit: z.number().int().min(1).max(500).default(250),
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
    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      status: url.searchParams.get("status") || undefined,
      channel: url.searchParams.get("channel") || undefined,
      limit: url.searchParams.get("limit") || 50,
    });
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery query valid nahi hai.",
        },
        {
          status: 400,
        },
      );
    }
    const [deliveries, schedulerRuns] = await Promise.all([
      listNotificationDeliveries({
        username: session.username,
        ...parsedQuery.data,
      }),
      listSchedulerRuns({
        limit: 20,
      }),
    ]);
    return NextResponse.json(
      {
        success: true,
        deliveries,
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
          error instanceof Error
            ? error.message
            : "Notification deliveries load nahi huin.",
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
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsedInput = queueInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery queue input valid nahi hai.",
        },
        {
          status: 400,
        },
      );
    }
    const queuedCount = await queueUndeliveredNotifications({
      limit: parsedInput.data.limit,
    });
    return NextResponse.json({
      success: true,
      queuedCount,
      message: `${queuedCount} notification deliveries queue huin.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Notification delivery queue create nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
