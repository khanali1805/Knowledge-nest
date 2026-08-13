import type { Metadata } from "next";
import { ArticleCard } from "@/components/site/article-card";
import { Pagination } from "@/components/site/pagination";
import { SiteSearchForm } from "@/components/site/search/site-search-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { searchPaginatedPublishedArticles } from "@/lib/queries/article-queries";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};
export const dynamic = "force-dynamic";
function normalizeSearchQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}
function normalizePage(value: string | string[] | undefined): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  const parsedPage = Number(normalizedValue);
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}
export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const [resolvedSearchParams, settings] = await Promise.all([
    searchParams,
    getPublicSiteSettings(),
  ]);
  const query = normalizeSearchQuery(resolvedSearchParams.q);
  const page = normalizePage(resolvedSearchParams.page);
  const title = query
    ? `Search results for "${query}"${page > 1 ? ` - Page ${page}` : ""}`
    : `Search Articles | ${settings.siteName}`;
  return {
    title,
    description: `Search published articles on ${settings.siteName}.`,
    alternates: {
      canonical: "/search",
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [resolvedSearchParams, settings] = await Promise.all([
    searchParams,
    getPublicSiteSettings(),
  ]);
  const query = normalizeSearchQuery(resolvedSearchParams.q);
  const requestedPage = normalizePage(resolvedSearchParams.page);
  const pagination = query
    ? await searchPaginatedPublishedArticles(query, requestedPage, settings.postsPerPage)
    : {
        articles: [],
        total: 0,
        page: 1,
        pageSize: settings.postsPerPage,
        totalPages: 1,
      };
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
          ) : pagination.total === 0 ? (
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
                  {pagination.total} {pagination.total === 1 ? "article" : "articles"}{" "}
                  found
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pagination.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              <Pagination
                basePath="/search"
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                query={{
                  q: query,
                }}
              />
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
