import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ArticleJsonLd } from "@/components/site/seo/article-json-ld";
import { BreadcrumbJsonLd } from "@/components/site/seo/breadcrumb-json-ld";
import {
  createContentSlug,
  getArticleExcerpt,
  getPublishedArticleBySlug,
} from "@/lib/queries/article-queries";
type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};
export const dynamic = "force-dynamic";
function getContentParagraphs(content: string): string[] {
  const textContent = content
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return textContent
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article Not Found",
    };
  }
  const excerpt = getArticleExcerpt(article);
  const publishedAt = article.publishedAt ?? article.updatedAt;
  return {
    title: article.title,
    description: excerpt,
    alternates: {
      canonical: `/article/${article.slug}`,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: excerpt,
      url: `/article/${article.slug}`,
      publishedTime: publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      section: article.categoryName ?? "Articles",
      ...(article.featuredImageUrl
        ? {
            images: [
              {
                url: article.featuredImageUrl,
                alt: article.featuredImageAlt || article.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: article.featuredImageUrl ? "summary_large_image" : "summary",
      title: article.title,
      description: excerpt,
      ...(article.featuredImageUrl
        ? {
            images: [article.featuredImageUrl],
          }
        : {}),
    },
  };
}
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    notFound();
  }
  const excerpt = getArticleExcerpt(article);
  const categoryName = article.categoryName ?? "Articles";
  const categorySlug = article.categorySlug ?? createContentSlug(categoryName);
  const publishedAt = article.publishedAt ?? article.updatedAt;
  const paragraphs = getContentParagraphs(article.content);
  return (
    <>
      <ArticleJsonLd
        title={article.title}
        excerpt={excerpt}
        slug={article.slug}
        publishedAt={publishedAt.toISOString()}
        modifiedAt={article.updatedAt.toISOString()}
        categoryName={categoryName}
        imageUrl={article.featuredImageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: categoryName,
            path: `/category/${categorySlug}`,
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
                href={`/category/${categorySlug}`}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold tracking-wide uppercase"
              >
                {categoryName}
              </Link>
              <h1 className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
                {article.title}
              </h1>
              <p className="text-muted-foreground mt-5 text-lg leading-8">{excerpt}</p>
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-4 text-sm">
                <time dateTime={publishedAt.toISOString()}>
                  {publishedAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {article.readingTimeMinutes} min read
                </span>
              </div>
            </div>
          </header>
          {article.featuredImageUrl ? (
            <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <Image
                  src={article.featuredImageUrl}
                  alt={article.featuredImageAlt || article.title}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="space-y-6 text-base leading-8 sm:text-lg">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p key={`${article.id}-${index}`}>{paragraph}</p>
                ))
              ) : (
                <p>{excerpt}</p>
              )}
            </div>
            <div className="border-border mt-12 border-t pt-8">
              <Link
                href={`/category/${categorySlug}`}
                className="text-sm font-semibold hover:underline"
              >
                More from {categoryName}
              </Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
