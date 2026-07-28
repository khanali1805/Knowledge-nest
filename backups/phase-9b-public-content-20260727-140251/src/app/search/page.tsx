import type { Metadata } from "next";
import { ArticleCard } from "@/components/site/article-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteSearchForm } from "@/components/site/search/site-search-form";
import { publicArticles } from "@/data/public-content";
type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};
export const metadata: Metadata = {
  title: "Search Articles | Knowledge Nest",
  description: "Search educational articles published on Knowledge Nest.",
  robots: {
    index: false,
    follow: true,
  },
};
function normalizeSearchQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = normalizeSearchQuery(resolvedSearchParams.q);
  const normalizedQuery = query.toLowerCase();
  const results = normalizedQuery
    ? publicArticles.filter((article) => {
        const searchableContent = [
          article.title,
          article.excerpt,
          article.category.name,
          ...article.content,
        ]
          .join(" ")
          .toLowerCase();
        return searchableContent.includes(normalizedQuery);
      })
    : [];
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-border bg-muted/30 border-b">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Search Articles
            </h1>
            <div className="mt-6">
              <SiteSearchForm initialQuery={query} />
            </div>
          </div>
        </section>
        <section className="mx-auto min-h-[420px] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {!query ? (
            <div className="border-border bg-background rounded-xl border p-10 text-center">
              <p className="text-muted-foreground text-sm">
                Enter a topic, article title or category to begin searching.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="border-border bg-background rounded-xl border p-10 text-center">
              <h2 className="text-lg font-semibold">No results found</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                No published articles matched &quot;{query}&quot;.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold">Results for &quot;{query}&quot;</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {results.length} {results.length === 1 ? "article" : "articles"} found
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {results.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
