import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
export const designCodeRevisions = pgTable("design_code_revisions", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  code: text("code").notNull(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  activatedAt: timestamp("activated_at", {
    withTimezone: true,
  }),
});
export const designCodeState = pgTable("design_code_state", {
  id: varchar("id", { length: 40 }).primaryKey(),
  draftName: varchar("draft_name", { length: 120 }).notNull(),
  draftCode: text("draft_code").notNull(),
  activeRevisionId: uuid("active_revision_id").references(() => designCodeRevisions.id, {
    onDelete: "restrict",
  }),
  lastValidRevisionId: uuid("last_valid_revision_id").references(
    () => designCodeRevisions.id,
    {
      onDelete: "restrict",
    },
  ),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
