"use client";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
type SiteSearchFormProps = {
  initialQuery?: string;
  compact?: boolean;
};
export function SiteSearchForm({
  initialQuery = "",
  compact = false,
}: SiteSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  }
  function clearSearch() {
    setQuery("");
    router.push("/search");
  }
  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={compact ? "w-full" : "mx-auto w-full max-w-2xl"}
    >
      <label htmlFor={compact ? "header-search" : "page-search"} className="sr-only">
        Search articles
      </label>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          id={compact ? "header-search" : "page-search"}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles"
          autoComplete="off"
          className={`border-border bg-background focus:ring-foreground/20 w-full rounded-lg border pr-11 pl-10 outline-none focus:ring-4 ${
            compact ? "h-10 text-sm" : "h-12 text-base"
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
