import Image from "next/image";
import Link from "next/link";
import {
  createContentSlug,
  getPublishedArticlesForNiche,
  type PublishedArticleRecord,
} from "@/lib/queries/article-queries";
import { getActiveTheme } from "@/lib/theme/theme-store";
import type { ThemeConfiguration, ThemeSection } from "@/lib/theme/types";
function formatNicheName(niche: string): string {
  return niche
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
function getArticleDescription(article: PublishedArticleRecord): string {
  const excerpt = article.excerpt?.trim();
  if (excerpt) {
    return excerpt;
  }
  const cleanContent = article.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleanContent) {
    return "Read the complete article for more information.";
  }
  return cleanContent.length > 180
    ? `${cleanContent.slice(0, 177).trimEnd()}...`
    : cleanContent;
}
function ThemeArticleCard({
  article,
  theme,
  index,
}: {
  article: PublishedArticleRecord;
  theme: ThemeConfiguration;
  index: number;
}) {
  const categoryName = article.categoryName ?? formatNicheName(theme.niche);
  const categorySlug = article.categorySlug ?? createContentSlug(categoryName);
  return (
    <article
      className="group overflow-hidden rounded-2xl border transition-transform hover:-translate-y-1"
      style={{
        borderColor: theme.colours.border,
        backgroundColor: theme.colours.background,
      }}
    >
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{
          background:
            index % 3 === 0
              ? `linear-gradient(135deg, ${theme.colours.primary}, ${theme.colours.secondary})`
              : index % 3 === 1
                ? `linear-gradient(135deg, ${theme.colours.secondary}, ${theme.colours.accent})`
                : `linear-gradient(135deg, ${theme.colours.accent}, ${theme.colours.primary})`,
        }}
      >
        {article.featuredImageUrl ? (
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <span className="text-center text-sm font-bold tracking-[0.2em] uppercase opacity-80">
              {categoryName}
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <Link
          href={`/category/${categorySlug}`}
          className="text-xs font-bold tracking-wider uppercase"
          style={{
            color: theme.colours.primary,
          }}
        >
          {categoryName}
        </Link>
        <h3
          className="mt-3 text-lg leading-snug font-bold"
          style={{
            fontFamily: theme.typography.headingFont,
          }}
        >
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 opacity-70">
          {getArticleDescription(article)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs opacity-65">
          <span>{article.readingTimeMinutes} min read</span>
          {article.publishedAt ? (
            <time dateTime={article.publishedAt.toISOString()}>
              {article.publishedAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          ) : null}
        </div>
      </div>
    </article>
  );
}
function EmptyContentState({
  theme,
  section,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
}) {
  const nicheName = formatNicheName(theme.niche);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="rounded-3xl border px-6 py-16 text-center sm:px-10"
        style={{
          borderColor: theme.colours.border,
          backgroundColor: theme.colours.muted,
        }}
      >
        <p
          className="text-xs font-bold tracking-[0.22em] uppercase"
          style={{
            color: theme.colours.primary,
          }}
        >
          {nicheName}
        </p>
        <h2
          className="mt-4 text-3xl font-bold"
          style={{
            fontFamily: theme.typography.headingFont,
          }}
        >
          {section.title || `Latest ${nicheName} Articles`}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 opacity-70">
          No published {nicheName.toLowerCase()} articles are available yet. New articles
          will appear here after they are written and published from the admin dashboard.
        </p>
      </div>
    </section>
  );
}
function HeroSection({
  theme,
  section,
  article,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
  article: PublishedArticleRecord | null;
}) {
  const nicheName = formatNicheName(theme.niche);
  if (!article) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-3xl px-6 py-14 sm:px-10 lg:px-14"
          style={{
            background: `linear-gradient(135deg, ${theme.colours.primary}, ${theme.colours.secondary})`,
            color: theme.colours.background,
          }}
        >
          <p className="text-xs font-bold tracking-[0.25em] uppercase opacity-80">
            {section.title}
          </p>
          <h1
            className="mt-5 max-w-4xl text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: theme.typography.headingFont,
            }}
          >
            Latest {nicheName} Stories
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 opacity-85 sm:text-lg">
            Published {nicheName.toLowerCase()} articles will appear here automatically.
          </p>
        </div>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-14 sm:px-10 lg:px-14"
        style={{
          background: `linear-gradient(135deg, ${theme.colours.primary}, ${theme.colours.secondary})`,
          color: theme.colours.background,
        }}
      >
        {article.featuredImageUrl ? (
          <>
            <Image
              src={article.featuredImageUrl}
              alt={article.featuredImageAlt || article.title}
              fill
              priority
              unoptimized
              className="object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-black/30" />
          </>
        ) : null}
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-[0.25em] uppercase opacity-80">
            {section.title}
          </p>
          <h1
            className="mt-5 max-w-4xl text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: theme.typography.headingFont,
            }}
          >
            {article.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 opacity-85 sm:text-lg">
            {getArticleDescription(article)}
          </p>
          <Link
            href={`/article/${article.slug}`}
            className="mt-8 inline-flex rounded-xl px-5 py-3 text-sm font-bold"
            style={{
              backgroundColor: theme.colours.background,
              color: theme.colours.primary,
            }}
          >
            Read featured article
          </Link>
        </div>
      </div>
    </section>
  );
}
function ArticleGridSection({
  theme,
  section,
  articles,
  offset,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
  articles: PublishedArticleRecord[];
  offset: number;
}) {
  const articleLimit = Math.max(1, Math.min(section.articleLimit || 6, 9));
  const sectionArticles = articles.slice(offset, offset + articleLimit);
  const nicheName = formatNicheName(theme.niche);
  if (sectionArticles.length === 0) {
    return <EmptyContentState theme={theme} section={section} />;
  }
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p
            className="text-xs font-bold tracking-[0.2em] uppercase"
            style={{
              color: theme.colours.primary,
            }}
          >
            {nicheName}
          </p>
          <h2
            className="mt-2 text-3xl font-bold"
            style={{
              fontFamily: theme.typography.headingFont,
            }}
          >
            {section.title}
          </h2>
        </div>
        <Link
          href={`/category/${createContentSlug(theme.niche)}`}
          className="text-sm font-semibold"
          style={{
            color: theme.colours.primary,
          }}
        >
          View all
        </Link>
      </div>
      <div
        className={
          theme.layout === "minimal"
            ? "grid gap-5"
            : theme.layout === "editorial"
              ? "grid gap-5 md:grid-cols-2"
              : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {sectionArticles.map((article, index) => (
          <ThemeArticleCard
            key={`${section.id}-${article.id}`}
            article={article}
            theme={theme}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
function CategoriesSection({
  theme,
  section,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2
        className="text-3xl font-bold"
        style={{
          fontFamily: theme.typography.headingFont,
        }}
      >
        {section.title}
      </h2>
      <div className="mt-6 flex flex-wrap gap-3">
        {theme.navigation.map((item, index) => (
          <Link
            key={`${item}-${index}`}
            href={index === 0 ? "/" : `/category/${createContentSlug(item)}`}
            className="rounded-full border px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              borderColor: theme.colours.border,
              backgroundColor:
                index === 0 ? theme.colours.primary : theme.colours.background,
              color: index === 0 ? theme.colours.background : theme.colours.foreground,
            }}
          >
            {item}
          </Link>
        ))}
      </div>
    </section>
  );
}
function NewsletterSection({
  theme,
  section,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="rounded-3xl p-7 sm:p-10"
        style={{
          backgroundColor: theme.colours.muted,
        }}
      >
        <h2
          className="text-3xl font-bold"
          style={{
            fontFamily: theme.typography.headingFont,
          }}
        >
          {section.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 opacity-70">
          Receive the latest {formatNicheName(theme.niche)} articles and important updates
          directly in your inbox.
        </p>
        <form className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Email address"
            className="min-h-12 flex-1 rounded-xl border px-4 outline-none"
            style={{
              borderColor: theme.colours.border,
              backgroundColor: theme.colours.background,
            }}
          />
          <button
            type="submit"
            className="min-h-12 rounded-xl px-6 font-bold"
            style={{
              backgroundColor: theme.colours.primary,
              color: theme.colours.background,
            }}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
export async function DynamicHomepage() {
  const theme = await getActiveTheme();
  const articles = await getPublishedArticlesForNiche(theme.niche, 50);
  const featuredArticle =
    articles.find((article) => article.isFeatured) ?? articles[0] ?? null;
  const sections = theme.sections
    .filter((section) => section.enabled)
    .slice()
    .sort((first, second) => first.position - second.position);
  const sectionsWithOffsets = sections.map((section, sectionIndex) => {
    const previousArticleSections = sections
      .slice(0, sectionIndex)
      .filter(
        (previousSection) =>
          previousSection.type !== "hero" &&
          previousSection.type !== "categories" &&
          previousSection.type !== "newsletter",
      );
    const articleOffset = previousArticleSections.reduce(
      (total, previousSection) =>
        total + Math.max(1, Math.min(previousSection.articleLimit || 6, 9)),
      0,
    );
    return {
      section,
      articleOffset,
    };
  });
  return (
    <main
      style={{
        backgroundColor: theme.colours.background,
        color: theme.colours.foreground,
        fontFamily: theme.typography.bodyFont,
      }}
    >
      {sectionsWithOffsets.map(({ section, articleOffset }) => {
        if (section.type === "hero") {
          return (
            <HeroSection
              key={section.id}
              theme={theme}
              section={section}
              article={featuredArticle}
            />
          );
        }
        if (section.type === "categories") {
          return <CategoriesSection key={section.id} theme={theme} section={section} />;
        }
        if (section.type === "newsletter") {
          return <NewsletterSection key={section.id} theme={theme} section={section} />;
        }
        return (
          <ArticleGridSection
            key={section.id}
            theme={theme}
            section={section}
            articles={articles}
            offset={articleOffset}
          />
        );
      })}
    </main>
  );
}
export default DynamicHomepage;
