import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArticleCard } from "@/components/site/article-card";
import { Pagination } from "@/components/site/pagination";
import { BreadcrumbJsonLd } from "@/components/site/seo/breadcrumb-json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  getPaginatedPublishedArticlesByCategory,
  getPublishedCategoryBySlug,
} from "@/lib/queries/article-queries";
import { getPublicSiteSettings } from "@/lib/settings/site-settings-store";
type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
};
export const dynamic = "force-dynamic";
function normalizePage(value: string | string[] | undefined): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  const parsedPage = Number(normalizedValue);
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}
export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams, settings] = await Promise.all([
    params,
    searchParams,
    getPublicSiteSettings(),
  ]);
  const category = await getPublishedCategoryBySlug(slug);
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }
  const page = normalizePage(resolvedSearchParams.page);
  const pageSuffix = page > 1 ? ` - Page ${page}` : "";
  const title = `${category.name} Articles${pageSuffix}`;
  const description =
    category.description ??
    `Browse published ${category.name.toLowerCase()} articles on ${settings.siteName}.`;
  const canonical =
    page > 1 ? `/category/${category.slug}?page=${page}` : `/category/${category.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, resolvedSearchParams, settings] = await Promise.all([
    params,
    searchParams,
    getPublicSiteSettings(),
  ]);
  const category = await getPublishedCategoryBySlug(slug);
  if (!category) {
    notFound();
  }
  const requestedPage = normalizePage(resolvedSearchParams.page);
  const pagination = await getPaginatedPublishedArticlesByCategory(
    category.id,
    requestedPage,
    settings.postsPerPage,
  );
  if (requestedPage !== pagination.page) {
    const canonicalPath =
      pagination.page > 1
        ? `/category/${category.slug}?page=${pagination.page}`
        : `/category/${category.slug}`;
    redirect(canonicalPath);
  }
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: category.name,
            path: `/category/${category.slug}`,
          },
        ]}
      />
      <SiteHeader />
      <main>
        <section className="border-border bg-muted/30 border-b">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-muted-foreground text-sm font-medium">Category</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {category.name}
            </h1>
            {category.description ? (
              <p className="text-muted-foreground mt-4 max-w-3xl leading-7">
                {category.description}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-4 text-sm">
              {pagination.total} {pagination.total === 1 ? "article" : "articles"}
            </p>
          </div>
        </section>
        <section className="mx-auto min-h-[420px] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {pagination.articles.length === 0 ? (
            <div className="border-border bg-background rounded-xl border p-10 text-center">
              <p className="text-muted-foreground text-sm">
                No published articles are available in this category.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pagination.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              <Pagination
                basePath={`/category/${category.slug}`}
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
              />
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
