/* eslint-disable @next/next/no-img-element -- CMS media URLs are dynamic. */
import Link from "next/link";
import { GoogleAdSenseUnit } from "@/components/site/google-adsense-unit";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getGoogleAdsenseClientId, getGoogleAdsenseHomeSlot } from "@/lib/adsense";
import {
  getArticleExcerpt,
  getGlobalHomepageContent,
  type PublishedArticleRecord,
} from "@/lib/public-content-runtime";
function formatDate(date: Date | null): string {
  if (!date) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function HomepageArticleCard({
  article,
  priority = false,
}: {
  article: PublishedArticleRecord;
  priority?: boolean;
}) {
  const categoryName = article.categoryName || "General Knowledge";
  const categorySlug = article.categorySlug || "general";
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/article/${article.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600"
      >
        {article.featuredImageUrl ? (
          <img
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold tracking-[0.2em] text-white/80 uppercase">
            {categoryName}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/category/${categorySlug}`}
          className="text-xs font-bold tracking-wider text-blue-700 uppercase hover:text-blue-900"
        >
          {categoryName}
        </Link>
        <h2 className="mt-3 text-xl leading-snug font-black text-slate-950">
          <Link href={`/article/${article.slug}`} className="hover:text-blue-700">
            {article.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {getArticleExcerpt(article)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5 text-xs font-medium text-slate-500">
          <span>{article.readingTimeMinutes} min read</span>
          {article.publishedAt ? (
            <time dateTime={article.publishedAt.toISOString()}>
              {formatDate(article.publishedAt)}
            </time>
          ) : null}
        </div>
      </div>
    </article>
  );
}
export async function ModernKnowledgeHomepage() {
  const { siteName, tagline, articles, categories } = await getGlobalHomepageContent();
  const adsenseClientId = getGoogleAdsenseClientId();
  const adsenseHomeSlot = getGoogleAdsenseHomeSlot();
  const featuredArticle =
    articles.find((article) => article.isFeatured) ?? articles[0] ?? null;
  const remainingArticles = featuredArticle
    ? articles.filter((article) => article.id !== featuredArticle.id)
    : articles;
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:px-8 lg:py-20">
            <div>
              <p className="text-sm font-black tracking-[0.24em] text-blue-700 uppercase">
                Knowledge • Stories • Information
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
                {siteName}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{tagline}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/latest"
                  className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Browse latest articles
                </Link>
                <Link
                  href="/featured"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold transition hover:border-blue-700 hover:text-blue-700"
                >
                  Featured stories
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl">
              <p className="text-xs font-bold tracking-[0.2em] text-blue-200 uppercase">
                Explore categories
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-slate-950"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
        {featuredArticle ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-72 bg-gradient-to-br from-blue-800 to-slate-950">
                  {featuredArticle.featuredImageUrl ? (
                    <img
                      src={featuredArticle.featuredImageUrl}
                      alt={featuredArticle.featuredImageAlt || featuredArticle.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
                  <p className="text-xs font-black tracking-[0.22em] text-blue-300 uppercase">
                    Featured article
                  </p>
                  <h2 className="mt-5 text-3xl leading-tight font-black sm:text-4xl">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-5 line-clamp-4 leading-7 text-white/70">
                    {getArticleExcerpt(featuredArticle)}
                  </p>
                  <Link
                    href={`/article/${featuredArticle.slug}`}
                    className="mt-8 inline-flex w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-100"
                  >
                    Read complete article
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}
        {adsenseClientId && adsenseHomeSlot ? (
          <section
            className="adsense-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            aria-label="Advertisement"
          >
            <GoogleAdSenseUnit
              client={adsenseClientId}
              slot={adsenseHomeSlot}
              className="w-full"
            />
          </section>
        ) : null}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-blue-700 uppercase">
                All published content
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Latest knowledge and stories
              </h2>
            </div>
            <Link
              href="/latest"
              className="text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              View all articles
            </Link>
          </div>
          {articles.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <h3 className="text-2xl font-black">No published articles yet</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                Published articles from every category will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {remainingArticles.map((article, index) => (
                <HomepageArticleCard
                  key={article.id}
                  article={article}
                  priority={index < 2}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
export default ModernKnowledgeHomepage;
