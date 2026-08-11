import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { PinterestTrackingPanel } from "@/components/admin/pinterest-tracking-panel";
import { db } from "@/db";
import { articles, categories, media } from "@/db/schema";
export const dynamic = "force-dynamic";
type DashboardMetric = {
  label: string;
  value: number;
  href: string;
  description: string;
};
function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "No date";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No date";
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
export default async function AdminDashboardPage() {
  const [
    totalArticleRows,
    publishedArticleRows,
    categoryRows,
    mediaRows,
    recentArticles,
    pinterestArticles,
  ] = await Promise.all([
    db
      .select({
        value: count(),
      })
      .from(articles),
    db
      .select({
        value: count(),
      })
      .from(articles)
      .where(eq(articles.status, "published")),
    db
      .select({
        value: count(),
      })
      .from(categories),
    db
      .select({
        value: count(),
      })
      .from(media),
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .orderBy(desc(articles.updatedAt))
      .limit(8),
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
      })
      .from(articles)
      .orderBy(desc(articles.updatedAt)),
  ]);
  const totalArticles = Number(totalArticleRows[0]?.value ?? 0);
  const publishedArticles = Number(publishedArticleRows[0]?.value ?? 0);
  const totalCategories = Number(categoryRows[0]?.value ?? 0);
  const totalMedia = Number(mediaRows[0]?.value ?? 0);
  const metrics: DashboardMetric[] = [
    {
      label: "Total Articles",
      value: totalArticles,
      href: "/admin/articles",
      description: "All articles currently stored in the database.",
    },
    {
      label: "Published",
      value: publishedArticles,
      href: "/admin/articles",
      description: "Articles currently published on the website.",
    },
    {
      label: "Categories",
      value: totalCategories,
      href: "/admin/categories",
      description: "Categories currently stored in the database.",
    },
    {
      label: "Media Files",
      value: totalMedia,
      href: "/admin/media",
      description: "Media records currently stored in the database.",
    },
  ];
  return (
    <main className="space-y-8">
      <section>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Knowledge Nest
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Admin Dashboard
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Live database overview for articles, publishing, categories and media.
          </p>
        </div>
      </section>
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Dashboard statistics"
      >
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <p className="text-sm font-bold text-slate-600">{metric.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              {metric.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{metric.description}</p>
          </Link>
        ))}
      </section>
      <PinterestTrackingPanel articles={pinterestArticles} />
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Recent Articles</h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest article records directly from PostgreSQL.
            </p>
          </div>
          <Link
            href="/admin/articles"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          >
            View all articles
          </Link>
        </div>
        {recentArticles.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-bold text-slate-900">No articles found</p>
            <p className="mt-2 text-sm text-slate-500">
              New article records will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/articles/${encodeURIComponent(article.id)}/edit`}
                    className="font-bold text-slate-950 hover:underline"
                  >
                    {article.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                    <span>Status: {article.status}</span>
                    <span>Updated: {formatDate(article.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/articles/${encodeURIComponent(article.id)}/edit`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  {article.status === "published" ? (
                    <Link
                      href={`/article/${encodeURIComponent(article.slug)}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
