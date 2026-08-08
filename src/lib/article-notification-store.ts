import "server-only";
import { and, asc, count, desc, eq, gt, inArray, lt, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  adminNotifications,
  articleActivityLogs,
  articleEditorPresence,
  articleRevisions,
  articles,
  auditRetentionPolicies,
  type AdminNotificationMetadata,
} from "@/db/schema";
const DEFAULT_POLICY_KEY = "default";
const DUPLICATE_ALERT_WINDOW_MS = 10 * 60 * 1000;
export type NotificationSeverity = "info" | "success" | "warning" | "critical";
export type AdminNotificationRecord = {
  id: string;
  recipientUsername: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  articleId: string | null;
  metadata: AdminNotificationMetadata | null;
  isRead: boolean;
  readAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};
export type AuditRetentionPolicyRecord = {
  id: string;
  policyKey: string;
  isEnabled: boolean;
  activityRetentionDays: number;
  notificationRetentionDays: number;
  revisionRetentionDays: number;
  lastCleanupAt: Date | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};
export type AuditCleanupResult = {
  skipped: boolean;
  activityLogsDeleted: number;
  notificationsDeleted: number;
  revisionsDeleted: number;
  completedAt: Date;
};
function normaliseLimit(value: number | undefined): number {
  return Math.min(Math.max(Math.trunc(value ?? 50), 1), 100);
}
function normaliseRetentionDays(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 3650);
}
function createRetentionDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
export async function createAdminNotification({
  recipientUsername,
  type,
  severity = "info",
  title,
  message,
  articleId,
  metadata,
  expiresAt,
}: {
  recipientUsername: string;
  type: string;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  articleId?: string | null;
  metadata?: AdminNotificationMetadata;
  expiresAt?: Date | null;
}): Promise<AdminNotificationRecord> {
  const [notification] = await db
    .insert(adminNotifications)
    .values({
      recipientUsername: recipientUsername.trim(),
      type: type.trim(),
      severity,
      title: title.trim(),
      message: message.trim(),
      articleId: articleId ?? null,
      metadata: metadata ?? null,
      expiresAt: expiresAt ?? null,
    })
    .returning();
  if (!notification) {
    throw new Error("Admin notification create nahi hui.");
  }
  return notification;
}
export async function listAdminNotifications({
  username,
  unreadOnly = false,
  limit,
}: {
  username: string;
  unreadOnly?: boolean;
  limit?: number;
}): Promise<AdminNotificationRecord[]> {
  const conditions = [
    eq(adminNotifications.recipientUsername, username),
    or(
      isNull(adminNotifications.expiresAt),
      gt(adminNotifications.expiresAt, new Date()),
    )!,
  ];
  if (unreadOnly) {
    conditions.push(eq(adminNotifications.isRead, false));
  }
  return db
    .select()
    .from(adminNotifications)
    .where(and(...conditions))
    .orderBy(desc(adminNotifications.createdAt))
    .limit(normaliseLimit(limit));
}
export async function getUnreadNotificationCount(username: string): Promise<number> {
  const [result] = await db
    .select({
      total: count(),
    })
    .from(adminNotifications)
    .where(
      and(
        eq(adminNotifications.recipientUsername, username),
        eq(adminNotifications.isRead, false),
        or(
          isNull(adminNotifications.expiresAt),
          gt(adminNotifications.expiresAt, new Date()),
        ),
      ),
    );
  return Number(result?.total ?? 0);
}
export async function markAdminNotificationRead({
  notificationId,
  username,
  isRead,
}: {
  notificationId: string;
  username: string;
  isRead: boolean;
}): Promise<AdminNotificationRecord | null> {
  const [notification] = await db
    .update(adminNotifications)
    .set({
      isRead,
      readAt: isRead ? new Date() : null,
    })
    .where(
      and(
        eq(adminNotifications.id, notificationId),
        eq(adminNotifications.recipientUsername, username),
      ),
    )
    .returning();
  return notification ?? null;
}
export async function markAllAdminNotificationsRead(username: string): Promise<number> {
  const updatedRows = await db
    .update(adminNotifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(adminNotifications.recipientUsername, username),
        eq(adminNotifications.isRead, false),
      ),
    )
    .returning({
      id: adminNotifications.id,
    });
  return updatedRows.length;
}
export async function deleteAdminNotification({
  notificationId,
  username,
}: {
  notificationId: string;
  username: string;
}): Promise<boolean> {
  const deletedRows = await db
    .delete(adminNotifications)
    .where(
      and(
        eq(adminNotifications.id, notificationId),
        eq(adminNotifications.recipientUsername, username),
      ),
    )
    .returning({
      id: adminNotifications.id,
    });
  return deletedRows.length > 0;
}
export async function getAuditRetentionPolicy(): Promise<AuditRetentionPolicyRecord> {
  await db
    .insert(auditRetentionPolicies)
    .values({
      policyKey: DEFAULT_POLICY_KEY,
    })
    .onConflictDoNothing({
      target: auditRetentionPolicies.policyKey,
    });
  const [policy] = await db
    .select()
    .from(auditRetentionPolicies)
    .where(eq(auditRetentionPolicies.policyKey, DEFAULT_POLICY_KEY))
    .limit(1);
  if (!policy) {
    throw new Error("Audit retention policy load nahi hui.");
  }
  return policy;
}
export async function updateAuditRetentionPolicy({
  username,
  isEnabled,
  activityRetentionDays,
  notificationRetentionDays,
  revisionRetentionDays,
}: {
  username: string;
  isEnabled: boolean;
  activityRetentionDays: number;
  notificationRetentionDays: number;
  revisionRetentionDays: number;
}): Promise<AuditRetentionPolicyRecord> {
  await getAuditRetentionPolicy();
  const [policy] = await db
    .update(auditRetentionPolicies)
    .set({
      isEnabled,
      activityRetentionDays: normaliseRetentionDays(activityRetentionDays, 180),
      notificationRetentionDays: normaliseRetentionDays(notificationRetentionDays, 90),
      revisionRetentionDays: normaliseRetentionDays(revisionRetentionDays, 365),
      updatedBy: username,
      updatedAt: new Date(),
    })
    .where(eq(auditRetentionPolicies.policyKey, DEFAULT_POLICY_KEY))
    .returning();
  if (!policy) {
    throw new Error("Audit retention policy update nahi hui.");
  }
  return policy;
}
export async function runAuditRetentionCleanup(): Promise<AuditCleanupResult> {
  const policy = await getAuditRetentionPolicy();
  const completedAt = new Date();
  if (!policy.isEnabled) {
    return {
      skipped: true,
      activityLogsDeleted: 0,
      notificationsDeleted: 0,
      revisionsDeleted: 0,
      completedAt,
    };
  }
  const activityCutoff = createRetentionDate(policy.activityRetentionDays);
  const notificationCutoff = createRetentionDate(policy.notificationRetentionDays);
  const revisionCutoff = createRetentionDate(policy.revisionRetentionDays);
  const [deletedActivities, deletedNotifications, deletedRevisions] =
    await db.transaction(async (transaction) => {
      const activities = await transaction
        .delete(articleActivityLogs)
        .where(lt(articleActivityLogs.createdAt, activityCutoff))
        .returning({
          id: articleActivityLogs.id,
        });
      const notifications = await transaction
        .delete(adminNotifications)
        .where(
          or(
            lt(adminNotifications.createdAt, notificationCutoff),
            lt(adminNotifications.expiresAt, completedAt),
          ),
        )
        .returning({
          id: adminNotifications.id,
        });
      const revisions = await transaction
        .delete(articleRevisions)
        .where(
          and(
            lt(articleRevisions.createdAt, revisionCutoff),
            inArray(articleRevisions.reason, ["autosave", "recovery"]),
          ),
        )
        .returning({
          id: articleRevisions.id,
        });
      return [activities, notifications, revisions] as const;
    });
  await db
    .update(auditRetentionPolicies)
    .set({
      lastCleanupAt: completedAt,
      updatedAt: completedAt,
    })
    .where(eq(auditRetentionPolicies.policyKey, DEFAULT_POLICY_KEY));
  return {
    skipped: false,
    activityLogsDeleted: deletedActivities.length,
    notificationsDeleted: deletedNotifications.length,
    revisionsDeleted: deletedRevisions.length,
    completedAt,
  };
}
async function notificationExistsRecently({
  recipientUsername,
  type,
  articleId,
}: {
  recipientUsername: string;
  type: string;
  articleId?: string | null;
}): Promise<boolean> {
  const cutoff = new Date(Date.now() - DUPLICATE_ALERT_WINDOW_MS);
  const conditions = [
    eq(adminNotifications.recipientUsername, recipientUsername),
    eq(adminNotifications.type, type),
    gt(adminNotifications.createdAt, cutoff),
  ];
  if (articleId) {
    conditions.push(eq(adminNotifications.articleId, articleId));
  }
  const [existing] = await db
    .select({
      id: adminNotifications.id,
    })
    .from(adminNotifications)
    .where(and(...conditions))
    .limit(1);
  return Boolean(existing);
}
export async function generateCollaborationAlerts(recipientUsername: string): Promise<{
  created: number;
  notifications: AdminNotificationRecord[];
}> {
  const now = new Date();
  const [activeSessions, recentCriticalActivities] = await Promise.all([
    db
      .select({
        articleId: articleEditorPresence.articleId,
        username: articleEditorPresence.username,
        sessionId: articleEditorPresence.sessionId,
        articleTitle: articles.title,
      })
      .from(articleEditorPresence)
      .innerJoin(articles, eq(articles.id, articleEditorPresence.articleId))
      .where(gt(articleEditorPresence.expiresAt, now))
      .orderBy(asc(articleEditorPresence.articleId)),
    db
      .select({
        id: articleActivityLogs.id,
        articleId: articleActivityLogs.articleId,
        username: articleActivityLogs.username,
        action: articleActivityLogs.action,
        summary: articleActivityLogs.summary,
        articleTitle: articles.title,
        createdAt: articleActivityLogs.createdAt,
      })
      .from(articleActivityLogs)
      .innerJoin(articles, eq(articles.id, articleActivityLogs.articleId))
      .where(
        and(
          gt(articleActivityLogs.createdAt, new Date(Date.now() - 30 * 60 * 1000)),
          inArray(articleActivityLogs.action, [
            "revision_restored",
            "article_published",
            "lock_conflict",
            "content_changed",
          ]),
        ),
      )
      .orderBy(desc(articleActivityLogs.createdAt))
      .limit(30),
  ]);
  const createdNotifications: AdminNotificationRecord[] = [];
  const sessionsByArticle = new Map<string, typeof activeSessions>();
  for (const session of activeSessions) {
    const existing = sessionsByArticle.get(session.articleId) ?? [];
    existing.push(session);
    sessionsByArticle.set(session.articleId, existing);
  }
  for (const [articleId, sessions] of sessionsByArticle) {
    if (sessions.length < 2) {
      continue;
    }
    const type = "multiple_editors_active";
    const duplicate = await notificationExistsRecently({
      recipientUsername,
      type,
      articleId,
    });
    if (duplicate) {
      continue;
    }
    const notification = await createAdminNotification({
      recipientUsername,
      type,
      severity: "warning",
      title: "Multiple editors active",
      message: `${sessions.length} editor sessions "${sessions[0]?.articleTitle ?? "Article"}" par active hain.`,
      articleId,
      metadata: {
        source: "collaboration_alert_scan",
        sessionCount: sessions.length,
        usernames: sessions.map((session) => session.username),
      },
    });
    createdNotifications.push(notification);
  }
  for (const activity of recentCriticalActivities) {
    const type = `activity_${activity.action}`;
    const duplicate = await notificationExistsRecently({
      recipientUsername,
      type,
      articleId: activity.articleId,
    });
    if (duplicate) {
      continue;
    }
    const severity: NotificationSeverity =
      activity.action === "lock_conflict"
        ? "critical"
        : activity.action === "revision_restored"
          ? "warning"
          : "info";
    const notification = await createAdminNotification({
      recipientUsername,
      type,
      severity,
      title: activity.action
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
      message: `${activity.username}: ${activity.summary}`,
      articleId: activity.articleId,
      metadata: {
        source: "collaboration_alert_scan",
        action: activity.action,
        username: activity.username,
        activityId: activity.id,
        articleTitle: activity.articleTitle,
      },
    });
    createdNotifications.push(notification);
  }
  return {
    created: createdNotifications.length,
    notifications: createdNotifications,
  };
}
