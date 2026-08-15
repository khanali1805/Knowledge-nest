import type { Metadata } from "next";
import { ArticleCard } from "@/components/site/article-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPopularPublishedArticles } from "@/lib/queries/article-queries";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Popular Articles",
  description: "Browse the most-read Knowledge Nest articles from every category.",
  alternates: {
    canonical: "/popular",
  },
};
export default async function PopularPage() {
  const articles = await getPopularPublishedArticles(100);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-700 uppercase">
          Most read
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Popular Articles
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          Browse the most-read published articles from all active categories.
        </p>
        {articles.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
            No popular articles are available.
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
