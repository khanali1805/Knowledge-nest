import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CalendarDays, Edit3, FileText, Plus, Star } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create, edit and publish website articles.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-foreground text-background inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      </div>
      {articleList.length === 0 ? (
        <div className="border-border bg-background rounded-xl border p-8 text-center shadow-sm">
          <FileText className="text-muted-foreground mx-auto h-10 w-10" />
          <p className="text-muted-foreground mt-3 text-sm">No articles are available.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articleList.map((article) => (
            <article
              key={article.id}
              className="border-border bg-background rounded-xl border p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium capitalize">
                      {article.status}
                    </span>
                    {article.categoryName ? (
                      <span className="border-border rounded-full border px-2.5 py-1 text-xs">
                        {article.categoryName}
                      </span>
                    ) : null}
                    {article.isFeatured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        <Star className="h-3 w-3" />
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 truncate text-lg font-semibold">{article.title}</h2>
                  {article.excerpt ? (
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                      {article.excerpt}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Updated {article.updatedAt.toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="border-border hover:bg-muted inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
