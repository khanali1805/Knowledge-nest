"use client";
import Link from "next/link";
import { ExternalLink, Menu, Search, Sparkles } from "lucide-react";
type AdminHeaderProps = Readonly<{
  onOpenNavigation: () => void;
}>;
export function AdminHeader({ onOpenNavigation }: AdminHeaderProps) {
  return (
    <header className="border-border/80 bg-background/90 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            onClick={onOpenNavigation}
            className="border-border bg-background hover:bg-muted focus-visible:ring-foreground/30 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm transition focus-visible:ring-2 focus-visible:outline-none lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="text-muted-foreground hidden h-4 w-4 sm:block" />
              <span className="truncate text-sm font-semibold sm:text-base">
                Knowledge Nest Administration
              </span>
            </div>
            <p className="text-muted-foreground hidden text-xs sm:block">
              Content, themes and publishing workspace
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/search"
            aria-label="Search website"
            className="border-border hover:bg-muted focus-visible:ring-foreground/30 inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:ring-2 focus-visible:outline-none"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="bg-foreground text-background focus-visible:ring-foreground/30 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none sm:px-4"
          >
            <span className="hidden sm:inline">View Website</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
