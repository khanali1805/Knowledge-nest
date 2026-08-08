import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createArticleActivity,
  listArticlePresence,
  removeArticlePresence,
  upsertArticlePresence,
} from "@/lib/article-collaboration-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
const presenceInputSchema = z.object({
  sessionId: z.uuid(),
  event: z.enum(["join", "heartbeat"]).default("heartbeat"),
});
const presenceDeleteSchema = z.object({
  sessionId: z.uuid(),
});
export async function GET(_request: Request, context: RouteContext) {
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
  const editors = await listArticlePresence(id);
  return NextResponse.json({
    success: true,
    editors,
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
    const parsedInput = presenceInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid presence session required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const { id } = await context.params;
    const presence = await upsertArticlePresence({
      articleId: id,
      sessionId: parsedInput.data.sessionId,
      username: session.username,
    });
    if (parsedInput.data.event === "join") {
      await createArticleActivity({
        articleId: id,
        username: session.username,
        action: "editor_joined",
        summary: `${session.username} ne article editor open kiya.`,
        metadata: {
          source: "editor_presence",
        },
      });
    }
    const editors = await listArticlePresence(id);
    return NextResponse.json({
      success: true,
      presence,
      editors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Editor presence update nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
export async function DELETE(request: Request, context: RouteContext) {
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
    const parsedInput = presenceDeleteSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid presence session required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const { id } = await context.params;
    const removed = await removeArticlePresence({
      articleId: id,
      sessionId: parsedInput.data.sessionId,
      username: session.username,
    });
    if (removed) {
      await createArticleActivity({
        articleId: id,
        username: session.username,
        action: "editor_left",
        summary: `${session.username} ne article editor close kiya.`,
        metadata: {
          source: "editor_presence",
        },
      });
    }
    return NextResponse.json({
      success: true,
      removed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Editor presence remove nahi hui.",
      },
      {
        status: 500,
      },
    );
  }
}
