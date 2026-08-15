import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getLiveUtilities, getPlannedUtilities } from "@/lib/utility-os";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Useful Tools & Planners | Knowledge Nest",
  description:
    "Explore practical category-specific Knowledge Nest calculators, planners, builders, and interactive tools.",
};
export default function ToolsPage() {
  const liveUtilities = getLiveUtilities();
  const plannedUtilities = getPlannedUtilities();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Knowledge Nest Utility OS
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Useful Tools & Planners
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-7 sm:text-lg">
            Interactive tools connected to the same eight categories used by Knowledge
            Nest articles.
          </p>
        </header>
        <section aria-labelledby="live-tools-heading" className="mt-10">
          <p className="text-muted-foreground text-sm font-medium">Available now</p>
          <h2 id="live-tools-heading" className="mt-1 text-2xl font-bold tracking-tight">
            Live tools
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {liveUtilities.map((utility) => {
              if (!utility.href) {
                return null;
              }
              return (
                <Link
                  key={utility.utilitySlug}
                  href={utility.href}
                  className="border-border bg-background hover:bg-muted/30 group rounded-2xl border p-6 transition-colors"
                >
                  <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    {utility.categoryName}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight">
                    {utility.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {utility.description}
                  </p>
                  <span className="mt-5 inline-flex text-sm font-semibold group-hover:underline">
                    Open tool →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <section
          aria-labelledby="planned-tools-heading"
          className="border-border bg-muted/20 mt-12 rounded-2xl border p-5 sm:p-6"
        >
          <p className="text-muted-foreground text-sm font-medium">Coming next</p>
          <h2
            id="planned-tools-heading"
            className="mt-1 text-2xl font-bold tracking-tight"
          >
            Category-specific utility roadmap
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6">
            Planned tools have no public destination until their implementation and
            testing are complete, so no dead tool links are created.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plannedUtilities.map((utility) => (
              <div
                key={utility.utilitySlug}
                className="border-border bg-background rounded-xl border p-4"
              >
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {utility.categoryName}
                </p>
                <p className="mt-1 font-semibold">{utility.shortTitle}</p>
                <p className="text-muted-foreground mt-2 text-xs">Planned</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
