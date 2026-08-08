import { randomUUID } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articleEditLocks } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};
const articleIdSchema = z.uuid();
const lockTokenSchema = z.object({
  lockToken: z.uuid(),
});
const LOCK_DURATION_MS = 120_000;
function getLockExpiry(): Date {
  return new Date(Date.now() + LOCK_DURATION_MS);
}
async function cleanupExpiredLock(articleId: string): Promise<void> {
  await db
    .delete(articleEditLocks)
    .where(
      and(
        eq(articleEditLocks.articleId, articleId),
        lt(articleEditLocks.expiresAt, new Date()),
      ),
    );
}
async function getCurrentLock(articleId: string) {
  await cleanupExpiredLock(articleId);
  const [lock] = await db
    .select()
    .from(articleEditLocks)
    .where(eq(articleEditLocks.articleId, articleId))
    .limit(1);
  return lock ?? null;
}
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
    if (!articleIdSchema.safeParse(id).success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid article ID required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const lock = await getCurrentLock(id);
    return NextResponse.json({
      success: true,
      lock,
      ownedByCurrentUser: lock?.ownerUsername === session.username,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        lock: null,
        ownedByCurrentUser: false,
        message: "Server lock status temporarily unavailable hai.",
      },
      {
        status: 503,
      },
    );
  }
}
export async function POST(_request: Request, context: RouteContext) {
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
    if (!articleIdSchema.safeParse(id).success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid article ID required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const currentLock = await getCurrentLock(id);
    const now = new Date();
    if (currentLock) {
      if (currentLock.ownerUsername !== session.username) {
        return NextResponse.json(
          {
            success: false,
            acquired: false,
            lock: currentLock,
            message: `Article ko ${currentLock.ownerUsername} edit kar raha hai.`,
          },
          {
            status: 409,
          },
        );
      }
      const [refreshedLock] = await db
        .update(articleEditLocks)
        .set({
          heartbeatAt: now,
          expiresAt: getLockExpiry(),
        })
        .where(
          and(
            eq(articleEditLocks.articleId, id),
            eq(articleEditLocks.ownerUsername, session.username),
          ),
        )
        .returning();
      if (!refreshedLock) {
        return NextResponse.json(
          {
            success: false,
            acquired: false,
            lock: null,
            message: "Article lock refresh nahi hua.",
          },
          {
            status: 503,
          },
        );
      }
      return NextResponse.json({
        success: true,
        acquired: true,
        lock: refreshedLock,
        message: "Article edit lock active hai.",
      });
    }
    const [createdLock] = await db
      .insert(articleEditLocks)
      .values({
        articleId: id,
        ownerUsername: session.username,
        lockToken: randomUUID(),
        acquiredAt: now,
        heartbeatAt: now,
        expiresAt: getLockExpiry(),
      })
      .returning();
    if (!createdLock) {
      return NextResponse.json(
        {
          success: false,
          acquired: false,
          lock: null,
          message: "Article edit lock create nahi hua.",
        },
        {
          status: 503,
        },
      );
    }
    return NextResponse.json({
      success: true,
      acquired: true,
      lock: createdLock,
      message: "Article edit lock active hai.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        acquired: false,
        lock: null,
        message: "Server lock temporarily unavailable hai.",
      },
      {
        status: 503,
      },
    );
  }
}
export async function PATCH(request: Request, context: RouteContext) {
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
    if (!articleIdSchema.safeParse(id).success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid article ID required hai.",
        },
        {
          status: 400,
        },
      );
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Valid lock request required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const parsed = lockTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid lock token required hai.",
        },
        {
          status: 400,
        },
      );
    }
    await cleanupExpiredLock(id);
    const now = new Date();
    const [lock] = await db
      .update(articleEditLocks)
      .set({
        heartbeatAt: now,
        expiresAt: getLockExpiry(),
      })
      .where(
        and(
          eq(articleEditLocks.articleId, id),
          eq(articleEditLocks.ownerUsername, session.username),
          eq(articleEditLocks.lockToken, parsed.data.lockToken),
        ),
      )
      .returning();
    if (!lock) {
      const currentLock = await getCurrentLock(id);
      return NextResponse.json(
        {
          success: false,
          lock: currentLock,
          message: currentLock
            ? "Article edit lock kisi aur session ke paas hai."
            : "Article edit lock expire ho chuka hai.",
        },
        {
          status: 409,
        },
      );
    }
    return NextResponse.json({
      success: true,
      lock,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        lock: null,
        message: "Server lock heartbeat temporarily unavailable hai.",
      },
      {
        status: 503,
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
    const { id } = await context.params;
    if (!articleIdSchema.safeParse(id).success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid article ID required hai.",
        },
        {
          status: 400,
        },
      );
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Valid lock release request required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const parsed = lockTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid lock token required hai.",
        },
        {
          status: 400,
        },
      );
    }
    const released = await db
      .delete(articleEditLocks)
      .where(
        and(
          eq(articleEditLocks.articleId, id),
          eq(articleEditLocks.ownerUsername, session.username),
          eq(articleEditLocks.lockToken, parsed.data.lockToken),
        ),
      )
      .returning({
        articleId: articleEditLocks.articleId,
      });
    return NextResponse.json({
      success: true,
      released: released.length > 0,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        released: false,
        message: "Server lock release temporarily unavailable hai.",
      },
      {
        status: 503,
      },
    );
  }
}
