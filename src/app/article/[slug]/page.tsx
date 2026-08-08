import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import sanitizeHtml from "sanitize-html";
import { GoogleAdSenseUnit } from "@/components/site/google-adsense-unit";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ArticleJsonLd } from "@/components/site/seo/article-json-ld";
import { BreadcrumbJsonLd } from "@/components/site/seo/breadcrumb-json-ld";
import { getGoogleAdsenseArticleSlot, getGoogleAdsenseClientId } from "@/lib/adsense";
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
function sanitizeArticleContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "hr",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "mark",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "class"],
      p: ["style", "class"],
      h1: ["style", "class"],
      h2: ["style", "class"],
      h3: ["style", "class"],
      h4: ["style", "class"],
      h5: ["style", "class"],
      h6: ["style", "class"],
      span: ["style", "class"],
      mark: ["style", "class"],
      table: ["class"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-family": [/^[a-zA-Z0-9 ,"'-]+$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        {
          rel: "noopener noreferrer",
        },
        true,
      ),
    },
  });
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
  const safeContent = sanitizeArticleContent(article.content);
  const adsenseClientId = getGoogleAdsenseClientId();
  const adsenseArticleSlot = getGoogleAdsenseArticleSlot();
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
            <div
              className="published-article-content"
              dangerouslySetInnerHTML={{
                __html: safeContent || `<p>${excerpt}</p>`,
              }}
            />
            {adsenseClientId && adsenseArticleSlot ? (
              <div
                className="mt-10 border-y border-slate-200 py-6"
                aria-label="Advertisement"
              >
                <GoogleAdSenseUnit
                  client={adsenseClientId}
                  slot={adsenseArticleSlot}
                  className="min-h-[90px] w-full"
                />
              </div>
            ) : null}
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
