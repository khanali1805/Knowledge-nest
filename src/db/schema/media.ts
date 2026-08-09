import {
  customType,
  bigint,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

const postgresBytea = customType<{
  data: Buffer;
  driverData: Buffer;
}>({
  dataType() {
    return "bytea";
  },
});
export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  uploadedById: uuid("uploaded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  type: varchar("type", { length: 30 }).notNull(),
  provider: varchar("provider", { length: 50 }).default("local").notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 150 }).notNull(),
  url: text("url").notNull(),
  storageKey: text("storage_key"),
  fileData: postgresBytea("file_data"),
  altText: varchar("alt_text", { length: 255 }),
  title: varchar("title", { length: 255 }),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  fileSize: bigint("file_size", { mode: "number" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
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
});
