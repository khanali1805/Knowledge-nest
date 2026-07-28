import { sql } from "drizzle-orm";
import { db } from "../src/db";
async function main() {
  const result = await db.execute(sql`
    select
      (select count(*)::int from articles) as articles,
      (select count(*)::int from categories) as categories,
      (select count(*)::int from tags) as tags,
      (select count(*)::int from pages) as pages,
      (select count(*)::int from settings) as settings
  `);
  console.log(JSON.stringify(result, null, 2));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
