import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
