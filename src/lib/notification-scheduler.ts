import "server-only";
import {
  generateCollaborationAlerts,
  runAuditRetentionCleanup,
} from "@/lib/article-notification-store";
import {
  claimPendingDeliveries,
  completeSchedulerRun,
  createSchedulerRun,
  markDeliveryFailed,
  markDeliverySucceeded,
  queueUndeliveredNotifications,
  type NotificationDeliveryRecord,
} from "@/lib/notification-delivery-store";
export type NotificationSchedulerResult = {
  schedulerRunId: string;
  status: "completed" | "failed";
  deliveriesQueued: number;
  deliveriesProcessed: number;
  deliveriesSucceeded: number;
  deliveriesFailed: number;
  alertScanRan: boolean;
  retentionCleanupRan: boolean;
  startedAt: string;
  completedAt: string;
  errors: string[];
};
async function deliverInApp(
  delivery: NotificationDeliveryRecord,
): Promise<Record<string, unknown>> {
  return {
    source: "in_app_delivery",
    deliveryId: delivery.id,
    deliveredAt: new Date().toISOString(),
  };
}
async function deliverEmail(
  delivery: NotificationDeliveryRecord,
): Promise<Record<string, unknown>> {
  const destination = delivery.destination?.trim();
  if (!destination) {
    throw new Error("Email delivery destination missing hai.");
  }
  const emailEndpoint = process.env.NOTIFICATION_EMAIL_ENDPOINT?.trim();
  if (!emailEndpoint) {
    throw new Error("NOTIFICATION_EMAIL_ENDPOINT configured nahi hai.");
  }
  const emailToken = process.env.NOTIFICATION_EMAIL_TOKEN?.trim();
  const response = await fetch(emailEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(emailToken
        ? {
            Authorization: `Bearer ${emailToken}`,
          }
        : {}),
    },
    body: JSON.stringify({
      deliveryId: delivery.id,
      notificationId: delivery.notificationId,
      recipient: destination,
      username: delivery.recipientUsername,
      metadata: delivery.metadata,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Email delivery fail hui (${response.status}): ${responseText.slice(0, 500)}`,
    );
  }
  let responseBody: unknown = null;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }
  return {
    source: "email_delivery",
    responseCode: response.status,
    response: responseBody,
  };
}
async function deliverWebhook(
  delivery: NotificationDeliveryRecord,
): Promise<Record<string, unknown>> {
  const destination = delivery.destination?.trim();
  if (!destination) {
    throw new Error("Webhook delivery destination missing hai.");
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(destination);
  } catch {
    throw new Error("Webhook URL valid nahi hai.");
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Webhook URL protocol allowed nahi hai.");
  }
  const response = await fetch(parsedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Knowledge-Nest-Delivery": delivery.id,
    },
    body: JSON.stringify({
      event: "admin.notification",
      deliveryId: delivery.id,
      notificationId: delivery.notificationId,
      recipientUsername: delivery.recipientUsername,
      metadata: delivery.metadata,
      sentAt: new Date().toISOString(),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Webhook delivery fail hui (${response.status}): ${responseText.slice(0, 500)}`,
    );
  }
  return {
    source: "webhook_delivery",
    responseCode: response.status,
  };
}
async function deliverNotification(
  delivery: NotificationDeliveryRecord,
): Promise<Record<string, unknown>> {
  if (delivery.channel === "in_app") {
    return deliverInApp(delivery);
  }
  if (delivery.channel === "email") {
    return deliverEmail(delivery);
  }
  if (delivery.channel === "webhook") {
    return deliverWebhook(delivery);
  }
  throw new Error(`Unsupported delivery channel: ${delivery.channel}`);
}
export async function runNotificationScheduler({
  recipientUsername,
  trigger = "manual",
  runAlertScan = true,
  runRetentionCleanup = true,
  deliveryLimit = 100,
}: {
  recipientUsername: string;
  trigger?: "manual" | "api" | "cron";
  runAlertScan?: boolean;
  runRetentionCleanup?: boolean;
  deliveryLimit?: number;
}): Promise<NotificationSchedulerResult> {
  const cleanRecipientUsername = recipientUsername.trim();
  if (!cleanRecipientUsername) {
    throw new Error("Notification scheduler recipient username required hai.");
  }
  const startedAt = new Date();
  const schedulerRun = await createSchedulerRun({
    trigger,
  });
  let deliveriesQueued = 0;
  let deliveriesProcessed = 0;
  let deliveriesSucceeded = 0;
  let deliveriesFailed = 0;
  let alertScanRan = false;
  let retentionCleanupRan = false;
  const errors: string[] = [];
  try {
    if (runAlertScan) {
      try {
        await generateCollaborationAlerts(cleanRecipientUsername);
        alertScanRan = true;
      } catch (alertError) {
        errors.push(
          alertError instanceof Error
            ? `Alert scan: ${alertError.message}`
            : "Alert scan fail hui.",
        );
      }
    }
    try {
      deliveriesQueued = await queueUndeliveredNotifications({
        limit: deliveryLimit * 5,
      });
    } catch (queueError) {
      errors.push(
        queueError instanceof Error
          ? `Delivery queue: ${queueError.message}`
          : "Delivery queue create nahi hui.",
      );
    }
    const claimedDeliveries = await claimPendingDeliveries({
      limit: deliveryLimit,
    });
    for (const delivery of claimedDeliveries) {
      deliveriesProcessed += 1;
      try {
        const metadata = await deliverNotification(delivery);
        await markDeliverySucceeded({
          deliveryId: delivery.id,
          metadata: {
            ...delivery.metadata,
            ...metadata,
            attemptNumber: delivery.attempts + 1,
          },
        });
        deliveriesSucceeded += 1;
      } catch (deliveryError) {
        const message =
          deliveryError instanceof Error
            ? deliveryError.message
            : "Notification delivery fail hui.";
        await markDeliveryFailed({
          deliveryId: delivery.id,
          message,
          metadata: {
            ...delivery.metadata,
            source: "delivery_failure",
            attemptNumber: delivery.attempts + 1,
          },
        });
        deliveriesFailed += 1;
        errors.push(`${delivery.channel}: ${message}`);
      }
    }
    if (runRetentionCleanup) {
      try {
        await runAuditRetentionCleanup();
        retentionCleanupRan = true;
      } catch (retentionError) {
        errors.push(
          retentionError instanceof Error
            ? `Retention cleanup: ${retentionError.message}`
            : "Retention cleanup fail hui.",
        );
      }
    }
    const completedAt = new Date();
    await completeSchedulerRun({
      schedulerRunId: schedulerRun.id,
      status: "completed",
      deliveriesQueued,
      deliveriesProcessed,
      deliveriesSucceeded,
      deliveriesFailed,
      retentionCleanupRan,
      alertScanRan,
      errorMessage: errors.length > 0 ? errors.join("\n") : null,
    });
    return {
      schedulerRunId: schedulerRun.id,
      status: "completed",
      deliveriesQueued,
      deliveriesProcessed,
      deliveriesSucceeded,
      deliveriesFailed,
      alertScanRan,
      retentionCleanupRan,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      errors,
    };
  } catch (schedulerError) {
    const completedAt = new Date();
    const message =
      schedulerError instanceof Error
        ? schedulerError.message
        : "Notification scheduler fail hua.";
    errors.push(message);
    await completeSchedulerRun({
      schedulerRunId: schedulerRun.id,
      status: "failed",
      deliveriesQueued,
      deliveriesProcessed,
      deliveriesSucceeded,
      deliveriesFailed,
      retentionCleanupRan,
      alertScanRan,
      errorMessage: errors.join("\n"),
    });
    return {
      schedulerRunId: schedulerRun.id,
      status: "failed",
      deliveriesQueued,
      deliveriesProcessed,
      deliveriesSucceeded,
      deliveriesFailed,
      alertScanRan,
      retentionCleanupRan,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      errors,
    };
  }
}
