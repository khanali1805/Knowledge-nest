"use client";
import Link from "next/link";
import { Edit3, Eye, FileText, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { readApiResponse } from "@/lib/http/read-api-response";
export type WebsitePage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};
type PagesManagerProps = {
  initialPages: WebsitePage[];
};
type DeleteResponse = {
  message?: string;
};
export function PagesManager({ initialPages }: PagesManagerProps) {
  const [pages, setPages] = useState<WebsitePage[]>(initialPages);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const filteredPages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return pages;
    }
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query) ||
        page.status.toLowerCase().includes(query),
    );
  }, [pages, searchQuery]);
  async function deletePage(page: WebsitePage) {
    const confirmed = window.confirm(`Delete "${page.title}" permanently?`);
    if (!confirmed) {
      return;
    }
    setDeletingId(page.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: "DELETE",
      });
      const responseData = await readApiResponse<DeleteResponse>(response);
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to delete the page.");
      }
      setPages((currentPages) =>
        currentPages.filter((currentPage) => currentPage.id !== page.id),
      );
      setMessage(responseData.message || "Page deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete the page.",
      );
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <div className="space-y-6 sm:space-y-8">
      {message ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
      <section className="border-border bg-background overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Website Pages</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative w-full sm:min-w-72">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pages"
                className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border py-2.5 pr-3 pl-10 text-sm outline-none focus:ring-4"
              />
            </div>
            <Link
              href="/admin/pages/new"
              className="bg-foreground text-background inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              New Page
            </Link>
          </div>
        </div>
        {filteredPages.length === 0 ? (
          <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <FileText className="h-10 w-10" />
            <p className="mt-3 text-sm">No matching pages were found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium">{page.title}</td>
                    <td className="text-muted-foreground px-5 py-4">/page/{page.slug}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          page.status === "published"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {page.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-5 py-4">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/page/${page.slug}`}
                          target="_blank"
                          aria-label={`Preview ${page.title}`}
                          className="border-border hover:bg-muted rounded-lg border p-2 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/pages/${page.id}/edit`}
                          aria-label={`Edit ${page.title}`}
                          className="border-border hover:bg-muted rounded-lg border p-2 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void deletePage(page)}
                          aria-label={`Delete ${page.title}`}
                          disabled={deletingId !== null}
                          className="border-border text-destructive hover:bg-muted rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === page.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
