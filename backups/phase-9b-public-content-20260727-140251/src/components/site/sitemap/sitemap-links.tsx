import Link from "next/link";
import { publicCategories, publicArticles } from "@/data/public-content";
export function SitemapLinks() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-bold">Categories</h2>
        <div className="mt-5 space-y-3">
          {publicCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="block hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">Articles</h2>
        <div className="mt-5 space-y-3">
          {publicArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              className="block hover:underline"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
