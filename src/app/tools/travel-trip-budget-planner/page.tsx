import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TravelTripBudgetPlanner } from "@/components/site/tools/travel-trip-budget-planner";
import { getUtilityBySlug } from "@/lib/utility-os";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Travel Trip Budget Planner | Knowledge Nest",
  description:
    "Estimate accommodation, food, transport, activities, extras, and a contingency buffer for a trip.",
};
export default function TravelTripBudgetPlannerPage() {
  const utility = getUtilityBySlug("travel-trip-budget-planner");
  if (!utility) {
    throw new Error("Travel Trip Budget Planner is missing from Utility OS.");
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
          <TravelTripBudgetPlanner />
        </div>
        <section className="border-border mt-12 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-2xl font-bold tracking-tight">How this planner works</h2>
          <div className="text-muted-foreground mt-4 space-y-3 text-sm leading-6">
            <p>
              Enter expected trip costs using one currency. The planner combines
              accommodation, food, transport, activities, extras, and a contingency
              buffer.
            </p>
            <p>
              It also calculates an estimated total per traveler and per traveler per day.
            </p>
            <p>The tool does not fetch live travel prices or exchange rates.</p>
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
