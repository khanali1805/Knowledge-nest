import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
export const publicReminders = pgTable(
  "public_reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerKey: varchar("owner_key", {
      length: 160,
    }).notNull(),
    utilitySlug: varchar("utility_slug", {
      length: 160,
    }).notNull(),
    categorySlug: varchar("category_slug", {
      length: 160,
    }).notNull(),
    sessionId: varchar("session_id", {
      length: 120,
    }),
    title: varchar("title", {
      length: 160,
    }).notNull(),
    note: text("note"),
    scheduledFor: timestamp("scheduled_for", {
      withTimezone: true,
    }).notNull(),
    timezone: varchar("timezone", {
      length: 80,
    })
      .default("UTC")
      .notNull(),
    frequency: varchar("frequency", {
      length: 30,
    })
      .default("once")
      .notNull(),
    status: varchar("status", {
      length: 30,
    })
      .default("active")
      .notNull(),
    lastTriggeredAt: timestamp("last_triggered_at", {
      withTimezone: true,
    }),
    nextTriggerAt: timestamp("next_trigger_at", {
      withTimezone: true,
    }).notNull(),
    triggerCount: integer("trigger_count").default(0).notNull(),
    metadata: jsonb("metadata"),
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
    index("public_reminders_owner_index").on(table.ownerKey),
    index("public_reminders_status_index").on(table.status),
    index("public_reminders_next_trigger_index").on(table.nextTriggerAt),
    index("public_reminders_utility_index").on(table.utilitySlug),
    index("public_reminders_category_index").on(table.categorySlug),
    index("public_reminders_session_index").on(table.sessionId),
    uniqueIndex("public_reminders_owner_id_unique").on(table.ownerKey, table.id),
  ],
);
export type PublicReminderDatabaseRecord = typeof publicReminders.$inferSelect;
export type NewPublicReminderDatabaseRecord = typeof publicReminders.$inferInsert;
