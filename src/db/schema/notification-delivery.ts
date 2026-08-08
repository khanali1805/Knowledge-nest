import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { adminNotifications } from "./article-notifications";
export type NotificationDeliveryMetadata = {
  source?: string;
  articleId?: string;
  notificationType?: string;
  attemptNumber?: number;
  providerMessageId?: string;
  responseCode?: number;
  [key: string]: unknown;
};
export const adminNotificationPreferences = pgTable(
  "admin_notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", {
      length: 150,
    }).notNull(),
    inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
    emailEnabled: boolean("email_enabled").default(false).notNull(),
    webhookEnabled: boolean("webhook_enabled").default(false).notNull(),
    emailAddress: varchar("email_address", {
      length: 320,
    }),
    webhookUrl: text("webhook_url"),
    minimumSeverity: varchar("minimum_severity", {
      length: 30,
    })
      .default("info")
      .notNull(),
    collaborationAlerts: boolean("collaboration_alerts").default(true).notNull(),
    criticalActivityAlerts: boolean("critical_activity_alerts").default(true).notNull(),
    multipleEditorAlerts: boolean("multiple_editor_alerts").default(true).notNull(),
    retentionAlerts: boolean("retention_alerts").default(true).notNull(),
    digestEnabled: boolean("digest_enabled").default(false).notNull(),
    digestIntervalMinutes: integer("digest_interval_minutes").default(60).notNull(),
    quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
    quietHoursStart: varchar("quiet_hours_start", {
      length: 5,
    })
      .default("22:00")
      .notNull(),
    quietHoursEnd: varchar("quiet_hours_end", {
      length: 5,
    })
      .default("07:00")
      .notNull(),
    timezone: varchar("timezone", {
      length: 80,
    })
      .default("UTC")
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("admin_notification_preferences_username_unique").on(table.username),
    index("admin_notification_preferences_email_index").on(table.emailEnabled),
    index("admin_notification_preferences_webhook_index").on(table.webhookEnabled),
    index("admin_notification_preferences_digest_index").on(table.digestEnabled),
  ],
);
export const adminNotificationDeliveries = pgTable(
  "admin_notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => adminNotifications.id, {
        onDelete: "cascade",
      }),
    recipientUsername: varchar("recipient_username", {
      length: 150,
    }).notNull(),
    channel: varchar("channel", {
      length: 30,
    }).notNull(),
    destination: text("destination"),
    status: varchar("status", {
      length: 30,
    })
      .default("pending")
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    processingStartedAt: timestamp("processing_started_at", {
      withTimezone: true,
    }),
    deliveredAt: timestamp("delivered_at", {
      withTimezone: true,
    }),
    failedAt: timestamp("failed_at", {
      withTimezone: true,
    }),
    nextAttemptAt: timestamp("next_attempt_at", {
      withTimezone: true,
    }),
    lastError: text("last_error"),
    metadata: jsonb("metadata").$type<NotificationDeliveryMetadata>(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_notification_deliveries_notification_index").on(table.notificationId),
    index("admin_notification_deliveries_recipient_index").on(table.recipientUsername),
    index("admin_notification_deliveries_status_index").on(table.status),
    index("admin_notification_deliveries_schedule_index").on(table.scheduledAt),
    index("admin_notification_deliveries_retry_index").on(table.nextAttemptAt),
    uniqueIndex("admin_notification_delivery_channel_unique").on(
      table.notificationId,
      table.channel,
    ),
  ],
);
export const notificationSchedulerRuns = pgTable(
  "notification_scheduler_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schedulerKey: varchar("scheduler_key", {
      length: 80,
    })
      .default("notification-delivery")
      .notNull(),
    status: varchar("status", {
      length: 30,
    })
      .default("running")
      .notNull(),
    trigger: varchar("trigger", {
      length: 30,
    })
      .default("manual")
      .notNull(),
    deliveriesQueued: integer("deliveries_queued").default(0).notNull(),
    deliveriesProcessed: integer("deliveries_processed").default(0).notNull(),
    deliveriesSucceeded: integer("deliveries_succeeded").default(0).notNull(),
    deliveriesFailed: integer("deliveries_failed").default(0).notNull(),
    retentionCleanupRan: boolean("retention_cleanup_ran").default(false).notNull(),
    alertScanRan: boolean("alert_scan_ran").default(false).notNull(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notification_scheduler_runs_key_index").on(table.schedulerKey),
    index("notification_scheduler_runs_status_index").on(table.status),
    index("notification_scheduler_runs_started_index").on(table.startedAt),
  ],
);
