import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { db } from "@/db";
import { pages } from "@/db/schema";
export const dynamic = "force-dynamic";
type PublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};
async function getPublishedPage(slug: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .limit(1);
  return page ?? null;
}
export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) {
    return {
      title: "Page Not Found",
    };
  }
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}
export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) {
    notFound();
  }
  return (
    <>
      <SiteHeader />
      <main>
        <header className="border-border bg-muted/30 border-b">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {page.title}
            </h1>
          </div>
        </header>
        <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-base leading-8 whitespace-pre-wrap">{page.content}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
