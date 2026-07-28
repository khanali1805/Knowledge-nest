import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { media } from "./media";
import { categories, tags } from "./taxonomy";
import { users } from "./users";
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    featuredImageId: uuid("featured_image_id").references(() => media.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    contentJson: jsonb("content_json").$type<Record<string, unknown>>(),
    status: varchar("status", { length: 30 }).default("draft").notNull(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    focusKeyword: varchar("focus_keyword", { length: 255 }),
    readingTimeMinutes: integer("reading_time_minutes").default(1).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
    }),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
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
  (table) => [
    uniqueIndex("articles_slug_unique").on(table.slug),
    index("articles_status_index").on(table.status),
    index("articles_category_index").on(table.categoryId),
    index("articles_author_index").on(table.authorId),
  ],
);
export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, {
        onDelete: "cascade",
      }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.articleId, table.tagId],
    }),
  ],
);
export const articleRevisions = pgTable(
  "article_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, {
        onDelete: "cascade",
      }),
    editedById: uuid("edited_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    revisionNumber: integer("revision_number").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("article_revision_unique").on(table.articleId, table.revisionNumber),
  ],
);
