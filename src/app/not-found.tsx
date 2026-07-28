import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Error 404
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Page not found
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-7">
            The requested page may have been removed, renamed or entered incorrectly.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="bg-foreground text-background inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
            <Link
              href="/search"
              className="border-border hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium"
            >
              <Search className="h-4 w-4" />
              Search Articles
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
