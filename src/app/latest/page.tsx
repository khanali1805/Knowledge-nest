import type { Metadata } from "next";
import { ArticleCard } from "@/components/site/article-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPublishedArticles } from "@/lib/queries/article-queries";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Latest Articles",
  description: "Browse the latest published Knowledge Nest articles from every category.",
  alternates: {
    canonical: "/latest",
  },
};
export default async function LatestPage() {
  const articles = await getPublishedArticles(100);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-700 uppercase">
          Recently published
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Latest Articles
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          Browse published articles from all active categories.
        </p>
        {articles.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
            No published articles are available.
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
