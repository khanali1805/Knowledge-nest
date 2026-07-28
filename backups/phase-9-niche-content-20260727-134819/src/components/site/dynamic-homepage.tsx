import Link from "next/link";
import { getActiveTheme } from "@/lib/theme/theme-store";
import type { ThemeConfiguration, ThemeSection } from "@/lib/theme/types";
const fallbackArticles = [
  {
    title: "Understanding the Basics of Personal Finance",
    slug: "understanding-the-basics-of-personal-finance",
    category: "Finance",
    description: "Learn practical principles for budgeting, saving and planning.",
  },
  {
    title: "How Artificial Intelligence Processes Information",
    slug: "how-artificial-intelligence-processes-information",
    category: "Technology",
    description: "A clear introduction to modern artificial intelligence systems.",
  },
  {
    title: "Why Scientific Research Uses Controlled Experiments",
    slug: "why-scientific-research-uses-controlled-experiments",
    category: "Science",
    description: "Understand how controlled testing improves research reliability.",
  },
  {
    title: "Building Better Digital Habits",
    slug: "building-better-digital-habits",
    category: "Lifestyle",
    description: "Simple methods for improving focus and reducing digital overload.",
  },
  {
    title: "Technology Trends Shaping the Modern World",
    slug: "technology-trends-shaping-the-modern-world",
    category: "Technology",
    description: "Explore major technologies influencing business and everyday life.",
  },
  {
    title: "A Practical Guide to Lifelong Learning",
    slug: "a-practical-guide-to-lifelong-learning",
    category: "Education",
    description: "Create a sustainable learning system for long-term growth.",
  },
  {
    title: "How Healthy Routines Support Better Performance",
    slug: "how-healthy-routines-support-better-performance",
    category: "Health",
    description: "Improve energy and consistency through practical daily routines.",
  },
  {
    title: "Understanding Global Business Markets",
    slug: "understanding-global-business-markets",
    category: "Business",
    description: "Learn how global markets affect companies and consumers.",
  },
  {
    title: "The Future of Sustainable Agriculture",
    slug: "the-future-of-sustainable-agriculture",
    category: "Agriculture",
    description: "Discover farming methods designed for efficiency and sustainability.",
  },
];
function createCategorySlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function ThemeArticleCard({
  article,
  theme,
  index,
}: {
  article: (typeof fallbackArticles)[number];
  theme: ThemeConfiguration;
  index: number;
}) {
  return (
    <article
      className="group overflow-hidden rounded-2xl border transition-transform hover:-translate-y-1"
      style={{
        borderColor: theme.colours.border,
        backgroundColor: theme.colours.background,
      }}
    >
      <div
        className="aspect-[16/9]"
        style={{
          background:
            index % 3 === 0
              ? `linear-gradient(135deg, ${theme.colours.primary}, ${theme.colours.secondary})`
              : index % 3 === 1
                ? `linear-gradient(135deg, ${theme.colours.secondary}, ${theme.colours.accent})`
                : `linear-gradient(135deg, ${theme.colours.accent}, ${theme.colours.primary})`,
        }}
      />
      <div className="p-5">
        <Link
          href={`/category/${createCategorySlug(article.category)}`}
          className="text-xs font-bold tracking-wider uppercase"
          style={{
            color: theme.colours.primary,
          }}
        >
          {article.category}
        </Link>
        <h3
          className="mt-3 text-lg leading-snug font-bold"
          style={{
            fontFamily: theme.typography.headingFont,
          }}
        >
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="mt-3 text-sm leading-6 opacity-70">{article.description}</p>
      </div>
    </article>
  );
}
function HeroSection({
  theme,
  section,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
}) {
  const primaryArticle = fallbackArticles[0];
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
          {primaryArticle.title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 opacity-85 sm:text-lg">
          {primaryArticle.description}
        </p>
        <Link
          href={`/article/${primaryArticle.slug}`}
          className="mt-8 inline-flex rounded-xl px-5 py-3 text-sm font-bold"
          style={{
            backgroundColor: theme.colours.background,
            color: theme.colours.primary,
          }}
        >
          Read featured article
        </Link>
      </div>
    </section>
  );
}
function ArticleGridSection({
  theme,
  section,
  offset,
}: {
  theme: ThemeConfiguration;
  section: ThemeSection;
  offset: number;
}) {
  const articleLimit = Math.max(1, Math.min(section.articleLimit || 6, 9));
  const articles = Array.from(
    {
      length: articleLimit,
    },
    (_, index) => fallbackArticles[(index + offset) % fallbackArticles.length],
  );
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
            {theme.niche}
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
          href="/feed"
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
        {articles.map((article, index) => (
          <ThemeArticleCard
            key={`${section.id}-${article.slug}-${index}`}
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
            href={`/category/${createCategorySlug(item)}`}
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
          Receive the latest {theme.niche} articles and important updates directly in your
          inbox.
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
  const sections = theme.sections
    .filter((section) => section.enabled)
    .slice()
    .sort((first, second) => first.position - second.position);
  return (
    <main
      style={{
        backgroundColor: theme.colours.background,
        color: theme.colours.foreground,
        fontFamily: theme.typography.bodyFont,
      }}
    >
      {sections.map((section, index) => {
        if (section.type === "hero") {
          return <HeroSection key={section.id} theme={theme} section={section} />;
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
            offset={index * 2}
          />
        );
      })}
    </main>
  );
}
export default DynamicHomepage;
