import Link from "next/link";
import {
  getPublishedArticles,
  getPublishedCategories,
} from "@/lib/queries/article-queries";
export async function SitemapLinks() {
  const [categories, articles] = await Promise.all([
    getPublishedCategories(),
    getPublishedArticles(200),
  ]);
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-bold">Categories</h2>
        <div className="mt-5 space-y-3">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active categories are available.
            </p>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="block hover:underline"
              >
                {category.name}
              </Link>
            ))
          )}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">Articles</h2>
        <div className="mt-5 space-y-3">
          {articles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No published articles are available.
            </p>
          ) : (
            articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="block hover:underline"
              >
                {article.title}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
