import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SitemapLinks } from "@/components/site/sitemap/sitemap-links";
export const metadata: Metadata = {
  title: "HTML Sitemap",
  description: "Browse all important pages on Knowledge Nest.",
  alternates: {
    canonical: "/sitemap-page",
  },
};
export default function SitemapPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-border bg-muted/30 border-b">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold">HTML Sitemap</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl">
              Browse all important pages, categories and articles.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SitemapLinks />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
