import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/site/article-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BreadcrumbJsonLd } from "@/components/site/seo/breadcrumb-json-ld";
import {
  getArticlesByCategory,
  getCategoryBySlug,
  publicCategories,
} from "@/data/public-content";
type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};
export function generateStaticParams() {
  return publicCategories.map((category) => ({
    slug: category.slug,
  }));
}
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }
  return {
    title: `${category.name} Articles`,
    description: `Browse educational ${category.name.toLowerCase()} articles on Knowledge Nest.`,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      type: "website",
      title: `${category.name} Articles`,
      description: `Browse educational ${category.name.toLowerCase()} articles on Knowledge Nest.`,
      url: `/category/${category.slug}`,
    },
  };
}
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }
  const articles = getArticlesByCategory(category.slug);
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
            <p className="text-muted-foreground mt-4 text-sm">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </p>
          </div>
        </section>
        <section className="mx-auto min-h-[420px] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {articles.length === 0 ? (
            <div className="border-border bg-background rounded-xl border p-10 text-center">
              <p className="text-muted-foreground text-sm">
                No published articles are available in this category.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
