import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CategoryUtilityWorkbench } from "@/components/site/tools/category-utility-workbench";
import { getUtilityBySlug } from "@/lib/utility-os";
type ToolPageProps = {
  params: Promise<{
    utilitySlug: string;
  }>;
};
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { utilitySlug } = await params;
  const utility = getUtilityBySlug(utilitySlug);
  if (!utility || utility.status !== "live" || !utility.href) {
    return {
      title: "Tool Not Found | Knowledge Nest",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  return {
    title: `${utility.title} | Knowledge Nest`,
    description: utility.description,
  };
}
export default async function CategoryUtilityPage({ params }: ToolPageProps) {
  const { utilitySlug } = await params;
  const utility = getUtilityBySlug(utilitySlug);
  if (
    !utility ||
    utility.status !== "live" ||
    !utility.href ||
    utility.categorySlug === "travel-lifestyle"
  ) {
    notFound();
  }
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
          <Link href="/tools" className="hover:text-foreground transition-colors">
            Tools
          </Link>
          <span className="px-2" aria-hidden="true">
            /
          </span>
          <span>{utility.shortTitle}</span>
        </nav>
        <header className="mt-6 max-w-3xl">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            {utility.categoryName} Utility
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {utility.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-7 sm:text-lg">
            {utility.description}
          </p>
        </header>
        <div className="mt-10">
          <CategoryUtilityWorkbench categorySlug={utility.categorySlug} />
        </div>
        <section className="border-border mt-12 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-2xl font-bold tracking-tight">How to use this tool</h2>
          <div className="text-muted-foreground mt-4 space-y-3 text-sm leading-6">
            <p>
              Adjust the inputs to match your own plan. Results update interactively and
              are intended to help organize practical everyday decisions.
            </p>
            <p>
              Your values stay inside the current browser interaction. This version does
              not require an account and does not write your plan to the Knowledge Nest
              database.
            </p>
            <p>
              Saving plans, progress, reminders, and cross-device continuity belong to the
              later Personal Knowledge Space and reminder architecture.
            </p>
          </div>
        </section>
        <div className="mt-8">
          <Link href="/tools" className="font-semibold hover:underline">
            ← View all Knowledge Nest tools
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
