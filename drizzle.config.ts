import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
config({ path: ".env.local" });
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://username:password@localhost:5432/knowledge_nest",
  },
  verbose: true,
  strict: true,
});
