import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ArticleJsonLd } from "@/components/site/seo/article-json-ld";
import { BreadcrumbJsonLd } from "@/components/site/seo/breadcrumb-json-ld";
import { getArticleBySlug, publicArticles } from "@/data/public-content";
type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};
export function generateStaticParams() {
  return publicArticles.map((article) => ({
    slug: article.slug,
  }));
}
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article Not Found",
    };
  }
  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `/article/${article.slug}`,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `/article/${article.slug}`,
      publishedTime: article.publishedAt,
      section: article.category.name,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.excerpt,
    },
  };
}
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    notFound();
  }
  return (
    <>
      <ArticleJsonLd
        title={article.title}
        excerpt={article.excerpt}
        slug={article.slug}
        publishedAt={article.publishedAt}
        categoryName={article.category.name}
      />
      <BreadcrumbJsonLd
        items={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: article.category.name,
            path: `/category/${article.category.slug}`,
          },
          {
            name: article.title,
            path: `/article/${article.slug}`,
          },
        ]}
      />
      <SiteHeader />
      <main>
        <article>
          <header className="border-border bg-muted/30 border-b">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
              <Link
                href={`/category/${article.category.slug}`}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold tracking-wide uppercase"
              >
                {article.category.name}
              </Link>
              <h1 className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
                {article.title}
              </h1>
              <p className="text-muted-foreground mt-5 text-lg leading-8">
                {article.excerpt}
              </p>
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-4 text-sm">
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readingTime}
                </span>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="space-y-6 text-base leading-8 sm:text-lg">
              {article.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="border-border mt-12 border-t pt-8">
              <Link
                href={`/category/${article.category.slug}`}
                className="text-sm font-semibold hover:underline"
              >
                More from {article.category.name}
              </Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
