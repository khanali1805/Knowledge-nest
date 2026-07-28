import Link from "next/link";
import { publicArticles } from "@/data/public-content";
export default function FeedPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold">RSS Feed</h1>
      <p className="text-muted-foreground mt-4">
        Subscribe to the Knowledge Nest RSS feed using your favourite RSS reader.
      </p>
      <div className="mt-8 rounded-xl border p-6">
        <Link href="/rss.xml" className="font-medium text-blue-600 hover:underline">
          https://your-domain.com/rss.xml
        </Link>
      </div>
      <div className="mt-10">
        <h2 className="text-2xl font-semibold">Latest Articles</h2>
        <div className="mt-6 space-y-4">
          {publicArticles.map((article) => (
            <article key={article.id} className="rounded-lg border p-4">
              <Link
                href={`/article/${article.slug}`}
                className="text-lg font-semibold hover:underline"
              >
                {article.title}
              </Link>
              <p className="text-muted-foreground mt-2 text-sm">{article.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
