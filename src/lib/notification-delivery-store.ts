import "server-only";
import { and, asc, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import {
  adminNotificationDeliveries,
  adminNotificationPreferences,
  adminNotifications,
  notificationSchedulerRuns,
  type NotificationDeliveryMetadata,
} from "@/db/schema";
export type NotificationDeliveryChannel = "in_app" | "email" | "webhook";
export type NotificationDeliveryStatus =
  "pending" | "processing" | "delivered" | "failed" | "cancelled";
export type NotificationPreferenceRecord = {
  id: string;
  username: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  emailAddress: string | null;
  webhookUrl: string | null;
  minimumSeverity: string;
  collaborationAlerts: boolean;
  criticalActivityAlerts: boolean;
  multipleEditorAlerts: boolean;
  retentionAlerts: boolean;
  digestEnabled: boolean;
  digestIntervalMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};
export type NotificationDeliveryRecord = {
  id: string;
  notificationId: string;
  recipientUsername: string;
  channel: string;
  destination: string | null;
  status: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  processingStartedAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  nextAttemptAt: Date | null;
  lastError: string | null;
  metadata: NotificationDeliveryMetadata | null;
  createdAt: Date;
  updatedAt: Date;
};
export type SchedulerRunRecord = {
  id: string;
  schedulerKey: string;
  status: string;
  trigger: string;
  deliveriesQueued: number;
  deliveriesProcessed: number;
  deliveriesSucceeded: number;
  deliveriesFailed: number;
  retentionCleanupRan: boolean;
  alertScanRan: boolean;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
};
const DEFAULT_MAX_ATTEMPTS = 5;
const SEVERITY_LEVELS: Record<string, number> = {
  info: 1,
  success: 1,
  warning: 2,
  critical: 3,
};
function normaliseLimit(value: number | undefined, maximum = 100): number {
  return Math.min(Math.max(Math.trunc(value ?? 50), 1), maximum);
}
function normaliseDigestInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 60;
  }
  return Math.min(Math.max(Math.trunc(value), 5), 10_080);
}
function normaliseTimeValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}
function severityAllowed(notificationSeverity: string, minimumSeverity: string): boolean {
  const notificationLevel = SEVERITY_LEVELS[notificationSeverity] ?? 1;
  const minimumLevel = SEVERITY_LEVELS[minimumSeverity] ?? 1;
  return notificationLevel >= minimumLevel;
}
function notificationTypeAllowed({
  type,
  preferences,
}: {
  type: string;
  preferences: NotificationPreferenceRecord;
}): boolean {
  if (type === "multiple_editors" && !preferences.multipleEditorAlerts) {
    return false;
  }
  if (type === "critical_activity" && !preferences.criticalActivityAlerts) {
    return false;
  }
  if (type.startsWith("retention_") && !preferences.retentionAlerts) {
    return false;
  }
  if (
    (type.startsWith("collaboration_") || type === "multiple_editors") &&
    !preferences.collaborationAlerts
  ) {
    return false;
  }
  return true;
}
function getRetryDate(attemptNumber: number): Date {
  const delayMinutes = Math.min(2 ** Math.max(attemptNumber, 1), 60);
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}
export async function getNotificationPreferences(
  username: string,
): Promise<NotificationPreferenceRecord> {
  const cleanUsername = username.trim();
  await db
    .insert(adminNotificationPreferences)
    .values({
      username: cleanUsername,
    })
    .onConflictDoNothing({
      target: adminNotificationPreferences.username,
    });
  const [preferences] = await db
    .select()
    .from(adminNotificationPreferences)
    .where(eq(adminNotificationPreferences.username, cleanUsername))
    .limit(1);
  if (!preferences) {
    throw new Error("Notification preferences load nahi huin.");
  }
  return preferences;
}
export async function updateNotificationPreferences({
  username,
  inAppEnabled,
  emailEnabled,
  webhookEnabled,
  emailAddress,
  webhookUrl,
  minimumSeverity,
  collaborationAlerts,
  criticalActivityAlerts,
  multipleEditorAlerts,
  retentionAlerts,
  digestEnabled,
  digestIntervalMinutes,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  timezone,
}: {
  username: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  emailAddress?: string | null;
  webhookUrl?: string | null;
  minimumSeverity: "info" | "success" | "warning" | "critical";
  collaborationAlerts: boolean;
  criticalActivityAlerts: boolean;
  multipleEditorAlerts: boolean;
  retentionAlerts: boolean;
  digestEnabled: boolean;
  digestIntervalMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}): Promise<NotificationPreferenceRecord> {
  const cleanUsername = username.trim();
  await getNotificationPreferences(cleanUsername);
  const [preferences] = await db
    .update(adminNotificationPreferences)
    .set({
      inAppEnabled,
      emailEnabled,
      webhookEnabled,
      emailAddress: emailAddress?.trim() || null,
      webhookUrl: webhookUrl?.trim() || null,
      minimumSeverity,
      collaborationAlerts,
      criticalActivityAlerts,
      multipleEditorAlerts,
      retentionAlerts,
      digestEnabled,
      digestIntervalMinutes: normaliseDigestInterval(digestIntervalMinutes),
      quietHoursEnabled,
      quietHoursStart: normaliseTimeValue(quietHoursStart, "22:00"),
      quietHoursEnd: normaliseTimeValue(quietHoursEnd, "07:00"),
      timezone: timezone.trim() || "UTC",
      updatedAt: new Date(),
    })
    .where(eq(adminNotificationPreferences.username, cleanUsername))
    .returning();
  if (!preferences) {
    throw new Error("Notification preferences save nahi huin.");
  }
  return preferences;
}
export async function queueNotificationDeliveries({
  notificationId,
}: {
  notificationId: string;
}): Promise<NotificationDeliveryRecord[]> {
  const [notification] = await db
    .select()
    .from(adminNotifications)
    .where(eq(adminNotifications.id, notificationId))
    .limit(1);
  if (!notification) {
    throw new Error("Notification delivery queue ke liye notification nahi mili.");
  }
  const preferences = await getNotificationPreferences(notification.recipientUsername);
  if (
    !severityAllowed(notification.severity, preferences.minimumSeverity) ||
    !notificationTypeAllowed({
      type: notification.type,
      preferences,
    })
  ) {
    return [];
  }
  const deliveries: Array<{
    notificationId: string;
    recipientUsername: string;
    channel: NotificationDeliveryChannel;
    destination: string | null;
    status: NotificationDeliveryStatus;
    scheduledAt: Date;
    nextAttemptAt: Date;
    maxAttempts: number;
    metadata: NotificationDeliveryMetadata;
  }> = [];
  const scheduledAt = new Date();
  if (preferences.inAppEnabled) {
    deliveries.push({
      notificationId: notification.id,
      recipientUsername: notification.recipientUsername,
      channel: "in_app",
      destination: notification.recipientUsername,
      status: "pending",
      scheduledAt,
      nextAttemptAt: scheduledAt,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      metadata: {
        source: "step9_delivery_queue",
        notificationType: notification.type,
      },
    });
  }
  if (preferences.emailEnabled && preferences.emailAddress) {
    deliveries.push({
      notificationId: notification.id,
      recipientUsername: notification.recipientUsername,
      channel: "email",
      destination: preferences.emailAddress,
      status: "pending",
      scheduledAt,
      nextAttemptAt: scheduledAt,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      metadata: {
        source: "step9_delivery_queue",
        notificationType: notification.type,
      },
    });
  }
  if (preferences.webhookEnabled && preferences.webhookUrl) {
    deliveries.push({
      notificationId: notification.id,
      recipientUsername: notification.recipientUsername,
      channel: "webhook",
      destination: preferences.webhookUrl,
      status: "pending",
      scheduledAt,
      nextAttemptAt: scheduledAt,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      metadata: {
        source: "step9_delivery_queue",
        notificationType: notification.type,
      },
    });
  }
  if (deliveries.length === 0) {
    return [];
  }
  const queuedRows = await db
    .insert(adminNotificationDeliveries)
    .values(deliveries)
    .onConflictDoNothing({
      target: [
        adminNotificationDeliveries.notificationId,
        adminNotificationDeliveries.channel,
      ],
    })
    .returning();
  return queuedRows;
}
export async function queueUndeliveredNotifications({
  limit,
}: {
  limit?: number;
} = {}): Promise<number> {
  const notifications = await db
    .select({
      id: adminNotifications.id,
    })
    .from(adminNotifications)
    .orderBy(asc(adminNotifications.createdAt))
    .limit(normaliseLimit(limit, 500));
  let queuedCount = 0;
  for (const notification of notifications) {
    const deliveries = await queueNotificationDeliveries({
      notificationId: notification.id,
    });
    queuedCount += deliveries.length;
  }
  return queuedCount;
}
export async function listNotificationDeliveries({
  username,
  status,
  channel,
  limit,
}: {
  username: string;
  status?: string;
  channel?: string;
  limit?: number;
}): Promise<NotificationDeliveryRecord[]> {
  const conditions = [eq(adminNotificationDeliveries.recipientUsername, username)];
  if (status) {
    conditions.push(eq(adminNotificationDeliveries.status, status));
  }
  if (channel) {
    conditions.push(eq(adminNotificationDeliveries.channel, channel));
  }
  return db
    .select()
    .from(adminNotificationDeliveries)
    .where(and(...conditions))
    .orderBy(desc(adminNotificationDeliveries.createdAt))
    .limit(normaliseLimit(limit));
}
export async function claimPendingDeliveries({
  limit,
}: {
  limit?: number;
} = {}): Promise<NotificationDeliveryRecord[]> {
  const now = new Date();
  const pendingRows = await db
    .select({
      id: adminNotificationDeliveries.id,
    })
    .from(adminNotificationDeliveries)
    .where(
      and(
        inArray(adminNotificationDeliveries.status, ["pending", "failed"]),
        lte(adminNotificationDeliveries.scheduledAt, now),
        or(
          isNull(adminNotificationDeliveries.nextAttemptAt),
          lte(adminNotificationDeliveries.nextAttemptAt, now),
        ),
        or(
          isNull(adminNotificationDeliveries.failedAt),
          lte(adminNotificationDeliveries.failedAt, now),
        ),
      ),
    )
    .orderBy(asc(adminNotificationDeliveries.scheduledAt))
    .limit(normaliseLimit(limit, 100));
  if (pendingRows.length === 0) {
    return [];
  }
  const ids = pendingRows.map((row) => row.id);
  return db
    .update(adminNotificationDeliveries)
    .set({
      status: "processing",
      processingStartedAt: now,
      updatedAt: now,
    })
    .where(inArray(adminNotificationDeliveries.id, ids))
    .returning();
}
export async function markDeliverySucceeded({
  deliveryId,
  metadata,
}: {
  deliveryId: string;
  metadata?: NotificationDeliveryMetadata;
}): Promise<NotificationDeliveryRecord | null> {
  const now = new Date();
  const [delivery] = await db
    .update(adminNotificationDeliveries)
    .set({
      status: "delivered",
      deliveredAt: now,
      failedAt: null,
      nextAttemptAt: null,
      lastError: null,
      metadata: metadata ?? null,
      updatedAt: now,
    })
    .where(eq(adminNotificationDeliveries.id, deliveryId))
    .returning();
  return delivery ?? null;
}
export async function markDeliveryFailed({
  deliveryId,
  message,
  metadata,
}: {
  deliveryId: string;
  message: string;
  metadata?: NotificationDeliveryMetadata;
}): Promise<NotificationDeliveryRecord | null> {
  const [existingDelivery] = await db
    .select()
    .from(adminNotificationDeliveries)
    .where(eq(adminNotificationDeliveries.id, deliveryId))
    .limit(1);
  if (!existingDelivery) {
    return null;
  }
  const nextAttempts = existingDelivery.attempts + 1;
  const permanentlyFailed = nextAttempts >= existingDelivery.maxAttempts;
  const now = new Date();
  const [delivery] = await db
    .update(adminNotificationDeliveries)
    .set({
      status: permanentlyFailed ? "cancelled" : "failed",
      attempts: nextAttempts,
      failedAt: now,
      nextAttemptAt: permanentlyFailed ? null : getRetryDate(nextAttempts),
      lastError: message.slice(0, 4000),
      metadata: metadata ?? null,
      updatedAt: now,
    })
    .where(eq(adminNotificationDeliveries.id, deliveryId))
    .returning();
  return delivery ?? null;
}
export async function createSchedulerRun({
  trigger,
}: {
  trigger: "manual" | "api" | "cron";
}): Promise<SchedulerRunRecord> {
  const [schedulerRun] = await db
    .insert(notificationSchedulerRuns)
    .values({
      schedulerKey: "notification-delivery",
      status: "running",
      trigger,
    })
    .returning();
  if (!schedulerRun) {
    throw new Error("Notification scheduler run create nahi hua.");
  }
  return schedulerRun;
}
export async function completeSchedulerRun({
  schedulerRunId,
  status,
  deliveriesQueued,
  deliveriesProcessed,
  deliveriesSucceeded,
  deliveriesFailed,
  retentionCleanupRan,
  alertScanRan,
  errorMessage,
}: {
  schedulerRunId: string;
  status: "completed" | "failed";
  deliveriesQueued: number;
  deliveriesProcessed: number;
  deliveriesSucceeded: number;
  deliveriesFailed: number;
  retentionCleanupRan: boolean;
  alertScanRan: boolean;
  errorMessage?: string | null;
}): Promise<SchedulerRunRecord | null> {
  const [schedulerRun] = await db
    .update(notificationSchedulerRuns)
    .set({
      status,
      deliveriesQueued,
      deliveriesProcessed,
      deliveriesSucceeded,
      deliveriesFailed,
      retentionCleanupRan,
      alertScanRan,
      errorMessage: errorMessage ?? null,
      completedAt: new Date(),
    })
    .where(eq(notificationSchedulerRuns.id, schedulerRunId))
    .returning();
  return schedulerRun ?? null;
}
export async function listSchedulerRuns({
  limit,
}: {
  limit?: number;
} = {}): Promise<SchedulerRunRecord[]> {
  return db
    .select()
    .from(notificationSchedulerRuns)
    .orderBy(desc(notificationSchedulerRuns.startedAt))
    .limit(normaliseLimit(limit, 100));
}
