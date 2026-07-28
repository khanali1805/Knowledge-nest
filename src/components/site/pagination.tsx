import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
};
function createPageHref(
  basePath: string,
  page: number,
  query: Record<string, string | undefined>,
): string {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      parameters.set(key, value);
    }
  }
  if (page > 1) {
    parameters.set("page", String(page));
  }
  const search = parameters.toString();
  return search ? `${basePath}?${search}` : basePath;
}
function createVisiblePages(currentPage: number, totalPages: number): number[] {
  const pages = new Set<number>([1, totalPages]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }
  return Array.from(pages).sort((first, second) => first - second);
}
export function Pagination({
  basePath,
  currentPage,
  totalPages,
  query = {},
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  const visiblePages = createVisiblePages(currentPage, totalPages);
  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={createPageHref(basePath, currentPage - 1, query)}
          aria-label="Previous page"
          className="border-border bg-background hover:bg-muted inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="border-border bg-muted text-muted-foreground inline-flex h-10 cursor-not-allowed items-center gap-1 rounded-lg border px-3 text-sm font-medium opacity-60"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}
      {visiblePages.map((page, index) => {
        const previousPage = visiblePages[index - 1];
        const showEllipsis = previousPage !== undefined && page - previousPage > 1;
        return (
          <span key={page} className="contents">
            {showEllipsis ? (
              <span className="text-muted-foreground px-1" aria-hidden="true">
                ...
              </span>
            ) : null}
            <Link
              href={createPageHref(basePath, page, query)}
              aria-current={page === currentPage ? "page" : undefined}
              className={
                page === currentPage
                  ? "bg-foreground text-background inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold"
                  : "border-border bg-background hover:bg-muted inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium"
              }
            >
              {page}
            </Link>
          </span>
        );
      })}
      {currentPage < totalPages ? (
        <Link
          href={createPageHref(basePath, currentPage + 1, query)}
          aria-label="Next page"
          className="border-border bg-background hover:bg-muted inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="border-border bg-muted text-muted-foreground inline-flex h-10 cursor-not-allowed items-center gap-1 rounded-lg border px-3 text-sm font-medium opacity-60"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
