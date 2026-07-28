import { asc } from "drizzle-orm";
import { db } from "../src/db";
import { siteSettings } from "../src/db/schema";
async function main() {
  const settings = await db
    .select()
    .from(siteSettings)
    .orderBy(asc(siteSettings.sortOrder), asc(siteSettings.key));
  console.log(JSON.stringify(settings, null, 2));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.exit();
  });
