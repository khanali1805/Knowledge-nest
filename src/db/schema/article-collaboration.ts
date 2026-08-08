import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { articles } from "./articles";
export type ArticleActivityMetadata = {
  changedFields?: string[];
  contentLength?: number;
  status?: string;
  source?: string;
  [key: string]: unknown;
};
export const articleActivityLogs = pgTable(
  "article_activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, {
        onDelete: "cascade",
      }),
    username: varchar("username", {
      length: 150,
    }).notNull(),
    action: varchar("action", {
      length: 80,
    }).notNull(),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<ArticleActivityMetadata>(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("article_activity_article_index").on(table.articleId),
    index("article_activity_created_index").on(table.createdAt),
    index("article_activity_action_index").on(table.action),
  ],
);
export const articleEditorPresence = pgTable(
  "article_editor_presence",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, {
        onDelete: "cascade",
      }),
    sessionId: uuid("session_id").notNull(),
    username: varchar("username", {
      length: 150,
    }).notNull(),
    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.articleId, table.sessionId],
    }),
    index("article_presence_article_index").on(table.articleId),
    index("article_presence_expiry_index").on(table.expiresAt),
  ],
);
