import { desc, eq } from "drizzle-orm";
import { ArticlesManager } from "@/components/admin/articles/articles-manager";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
export const dynamic = "force-dynamic";
export default async function ArticlesPage() {
  const articleList = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      status: articles.status,
      isFeatured: articles.isFeatured,
      categoryName: categories.name,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .orderBy(desc(articles.updatedAt));
  return (
    <ArticlesManager
      initialArticles={articleList.map((article) => ({
        ...article,
        updatedAt: article.updatedAt.toISOString(),
      }))}
    />
  );
}
