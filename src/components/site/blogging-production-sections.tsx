"use client";
/* eslint-disable @next/next/no-img-element -- CMS media URLs are dynamic. */
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Flame,
  FolderOpen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  createArticleListStructuredData,
  createArticleUrl,
  createCategoryUrl,
  createWebsiteStructuredData,
  formatArticleDate,
  type BloggingArticle,
  type BloggingOverview,
} from "@/lib/blogging-production";
const EMPTY_OVERVIEW: BloggingOverview = {
  featured: [],
  latest: [],
  trending: [],
  popular: [],
  categories: [],
  generatedAt: "",
};
type ArticleCardProps = {
  article: BloggingArticle;
  priority?: boolean;
};
function ArticleCard({ article, priority = false }: ArticleCardProps) {
  return (
    <article className="border-border bg-background group overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {article.featuredImageUrl ? (
        <Link
          href={createArticleUrl(article.slug)}
          className="bg-muted block aspect-[16/9] overflow-hidden"
        >
          <img
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt ?? article.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      ) : (
        <Link
          href={createArticleUrl(article.slug)}
          className="bg-muted flex aspect-[16/9] items-center justify-center"
        >
          <BookOpen className="text-muted-foreground h-8 w-8" aria-hidden="true" />
        </Link>
      )}
      <div className="p-4 sm:p-5">
        {article.categoryName && article.categorySlug ? (
          <Link
            href={createCategoryUrl(article.categorySlug)}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold tracking-wide uppercase"
          >
            {article.categoryName}
          </Link>
        ) : null}
        <h3 className="mt-2 line-clamp-2 text-base font-bold tracking-tight sm:text-lg">
          <Link href={createArticleUrl(article.slug)} className="hover:underline">
            {article.title}
          </Link>
        </h3>
        {article.excerpt ? (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
            {article.excerpt}
          </p>
        ) : null}
        <div className="text-muted-foreground mt-4 flex items-center justify-between gap-3 text-xs">
          <span>{formatArticleDate(article.publishedAt)}</span>
          <span>{Math.max(article.readingTimeMinutes, 1)} min read</span>
        </div>
      </div>
    </article>
  );
}
type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Sparkles;
};
function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  icon: Icon,
}: SectionHeadingProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="border-border hover:bg-muted inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition"
      >
        View All
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
export function BloggingProductionSections() {
  const [overview, setOverview] = useState<BloggingOverview>(EMPTY_OVERVIEW);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function loadOverview() {
      try {
        const response = await fetch("/api/blogging/overview", {
          method: "GET",
          credentials: "same-origin",
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as BloggingOverview;
        if (active) {
          setOverview(data);
        }
      } catch {
        if (active) {
          setOverview(EMPTY_OVERVIEW);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadOverview();
    return () => {
      active = false;
    };
  }, []);
  if (!isLoading && overview.latest.length === 0 && overview.featured.length === 0) {
    return null;
  }
  const structuredArticles =
    overview.featured.length > 0 ? overview.featured : overview.latest;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createWebsiteStructuredData()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createArticleListStructuredData(structuredArticles)),
        }}
      />
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {isLoading ? (
          <section
            aria-label="Loading articles"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="border-border bg-muted/30 h-72 animate-pulse rounded-2xl border"
              />
            ))}
          </section>
        ) : null}
        {!isLoading && overview.featured.length > 0 ? (
          <section aria-labelledby="featured-articles-heading">
            <SectionHeading
              eyebrow="Editor Selection"
              title="Featured Articles"
              description="Carefully selected guides, stories and useful knowledge from Knowledge Nest."
              href="/featured"
              icon={Sparkles}
            />
            <div
              id="featured-articles-heading"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {overview.featured.map((article, index) => (
                <ArticleCard key={article.id} article={article} priority={index < 2} />
              ))}
            </div>
          </section>
        ) : null}
        {!isLoading && overview.latest.length > 0 ? (
          <section aria-labelledby="latest-articles-heading">
            <SectionHeading
              eyebrow="Recently Published"
              title="Latest Articles"
              description="Explore the newest information, guides and updates published on Knowledge Nest."
              href="/latest"
              icon={BookOpen}
            />
            <div
              id="latest-articles-heading"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {overview.latest.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}
        {!isLoading && overview.trending.length > 0 ? (
          <section aria-labelledby="trending-articles-heading">
            <SectionHeading
              eyebrow="Popular Now"
              title="Trending Articles"
              description="Discover articles currently receiving the most attention across Knowledge Nest."
              href="/featured"
              icon={TrendingUp}
            />
            <div
              id="trending-articles-heading"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {overview.trending.map((article, index) => (
                <Link
                  key={article.id}
                  href={createArticleUrl(article.slug)}
                  className="border-border bg-background hover:bg-muted/50 group flex items-start gap-4 rounded-2xl border p-4 shadow-sm transition"
                >
                  <span className="bg-foreground text-background inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm leading-6 font-bold">
                      {article.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {article.categoryName ?? "Knowledge Nest"}
                    </span>
                  </span>
                  <ArrowRight
                    className="text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {!isLoading && overview.popular.length > 0 ? (
          <section aria-labelledby="popular-articles-heading">
            <SectionHeading
              eyebrow="Reader Interests"
              title="Popular Guides"
              description="Useful guides and articles selected from the most active Knowledge Nest categories."
              href="/search"
              icon={Flame}
            />
            <div
              id="popular-articles-heading"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {overview.popular.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}
        {!isLoading && overview.categories.length > 0 ? (
          <section aria-labelledby="knowledge-categories-heading">
            <SectionHeading
              eyebrow="Browse Knowledge"
              title="Explore Categories"
              description="Find articles by subject and explore the Knowledge Nest content library."
              href="/sitemap-page"
              icon={FolderOpen}
            />
            <div
              id="knowledge-categories-heading"
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {overview.categories.map((category) => (
                <Link
                  key={category.id}
                  href={createCategoryUrl(category.slug)}
                  className="border-border bg-background hover:bg-muted group rounded-2xl border p-5 shadow-sm transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold">{category.name}</span>
                    <ArrowRight
                      className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                  {category.description ? (
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-6">
                      {category.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
