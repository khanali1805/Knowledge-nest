"use client";
import Link from "next/link";
import { ExternalLink, Menu, Plus, Search } from "lucide-react";
type AdminHeaderProps = {
  onOpenNavigation: () => void;
};
export function AdminHeader({ onOpenNavigation }: AdminHeaderProps) {
  return (
    <header className="border-border/80 bg-background/90 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <button
          type="button"
          aria-label="Open admin navigation"
          className="border-border hover:bg-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors lg:hidden"
          onClick={onOpenNavigation}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:text-base">Administration</p>
          <p className="text-muted-foreground hidden truncate text-xs sm:block">
            Manage your Knowledge Nest website
          </p>
        </div>
        <div className="hidden max-w-md flex-1 md:block">
          <label className="border-border bg-muted/40 focus-within:border-ring focus-within:bg-background flex h-10 items-center gap-2 rounded-xl border px-3 transition-colors">
            <Search
              className="text-muted-foreground h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="sr-only">Search administration</span>
            <input
              type="search"
              placeholder="Search administration..."
              className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors sm:px-4"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">New Article</span>
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="border-border hover:bg-muted inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">View Website</span>
        </Link>
      </div>
    </header>
  );
}
