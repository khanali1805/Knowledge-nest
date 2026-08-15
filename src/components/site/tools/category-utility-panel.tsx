import Link from "next/link";
import { getLiveUtilitiesForCategory } from "@/lib/utility-os";
type CategoryUtilityPanelProps = {
  categorySlug?: string | null;
  context?: "article" | "category";
};
export function CategoryUtilityPanel({
  categorySlug,
  context = "article",
}: CategoryUtilityPanelProps) {
  const normalizedCategorySlug = categorySlug?.trim();
  if (!normalizedCategorySlug) {
    return null;
  }
  const utilities = getLiveUtilitiesForCategory(normalizedCategorySlug);
  if (utilities.length === 0) {
    return null;
  }
  const heading =
    context === "category"
      ? "Useful tools for this category"
      : "Useful tools for this topic";
  const description =
    context === "category"
      ? "Use practical tools designed specifically for this Knowledge Nest category."
      : "These tools match the category of the article you are currently reading.";
  return (
    <section
      aria-label={heading}
      className="border-border bg-muted/20 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Knowledge Nest Utility OS
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{heading}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
        </div>
        <Link href="/tools" className="text-sm font-semibold hover:underline">
          View all tools →
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {utilities.map((utility) => {
          if (!utility.href) {
            return null;
          }
          return (
            <Link
              key={utility.utilitySlug}
              href={utility.href}
              className="border-border bg-background hover:bg-muted/40 group rounded-xl border p-4 transition-colors"
            >
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {utility.categoryName}
              </p>
              <h3 className="mt-1 font-bold tracking-tight">{utility.shortTitle}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {utility.description}
              </p>
              <span className="mt-4 inline-flex text-sm font-semibold group-hover:underline">
                Open tool →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
