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
import { articles } from "./articles";
export type AdminNotificationMetadata = {
  source?: string;
  action?: string;
  username?: string;
  sessionCount?: number;
  [key: string]: unknown;
};
export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientUsername: varchar("recipient_username", {
      length: 150,
    }).notNull(),
    type: varchar("type", {
      length: 80,
    }).notNull(),
    severity: varchar("severity", {
      length: 30,
    })
      .default("info")
      .notNull(),
    title: varchar("title", {
      length: 255,
    }).notNull(),
    message: text("message").notNull(),
    articleId: uuid("article_id").references(() => articles.id, {
      onDelete: "cascade",
    }),
    metadata: jsonb("metadata").$type<AdminNotificationMetadata>(),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", {
      withTimezone: true,
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_notifications_recipient_index").on(table.recipientUsername),
    index("admin_notifications_read_index").on(table.isRead),
    index("admin_notifications_created_index").on(table.createdAt),
    index("admin_notifications_article_index").on(table.articleId),
  ],
);
export const auditRetentionPolicies = pgTable(
  "audit_retention_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyKey: varchar("policy_key", {
      length: 80,
    })
      .default("default")
      .notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    activityRetentionDays: integer("activity_retention_days").default(180).notNull(),
    notificationRetentionDays: integer("notification_retention_days")
      .default(90)
      .notNull(),
    revisionRetentionDays: integer("revision_retention_days").default(365).notNull(),
    lastCleanupAt: timestamp("last_cleanup_at", {
      withTimezone: true,
    }),
    updatedBy: varchar("updated_by", {
      length: 150,
    }),
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
  (table) => [uniqueIndex("audit_retention_policy_key_unique").on(table.policyKey)],
);
