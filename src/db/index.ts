import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
type Database = ReturnType<typeof drizzle>;
let database: Database | null = null;
function getDatabase(): Database {
  if (database) {
    return database;
  }
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Add a valid PostgreSQL connection string to .env.local.",
    );
  }
  const client = postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
  });
  database = drizzle(client);
  return database;
}
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const activeDatabase = getDatabase();
    const value = Reflect.get(activeDatabase, property, receiver);
    return typeof value === "function" ? value.bind(activeDatabase) : value;
  },
});
