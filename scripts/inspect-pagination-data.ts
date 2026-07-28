import { count, eq } from "drizzle-orm";
import { db } from "../src/db";
import { articles, categories } from "../src/db/schema";
async function main() {
  const categoryRows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      articleCount: count(articles.id),
    })
    .from(categories)
    .leftJoin(articles, eq(articles.categoryId, categories.id))
    .where(eq(categories.isActive, true))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(categories.name);
  const [publishedTotal] = await db
    .select({
      count: count(articles.id),
    })
    .from(articles)
    .where(eq(articles.status, "published"));
  console.log(
    JSON.stringify(
      {
        publishedArticles: Number(publishedTotal?.count ?? 0),
        categories: categoryRows.map((category) => ({
          ...category,
          articleCount: Number(category.articleCount),
        })),
      },
      null,
      2,
    ),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
