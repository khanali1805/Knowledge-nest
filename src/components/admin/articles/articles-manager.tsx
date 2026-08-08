"use client";
import {
  CalendarDays,
  CheckSquare,
  Edit3,
  FileText,
  LoaderCircle,
  Plus,
  Square,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  isFeatured: boolean;
  categoryName: string | null;
  updatedAt: string;
};
type DeleteResponse = {
  success?: boolean;
  message?: string;
};
type ArticlesManagerProps = {
  initialArticles: ArticleListItem[];
};
async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {} as T;
  }
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
export function ArticlesManager({ initialArticles }: ArticlesManagerProps) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set<string>());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set<string>());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const allSelected =
    articles.length > 0 && articles.every((article) => selectedIds.has(article.id));
  const selectedCount = selectedIds.size;
  const isDeleting = deletingIds.size > 0;
  const selectedArticles = useMemo(
    () => articles.filter((article) => selectedIds.has(article.id)),
    [articles, selectedIds],
  );
  function toggleSelected(articleId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  }
  function toggleAll() {
    setSelectedIds(() => {
      if (allSelected) {
        return new Set();
      }
      return new Set(articles.map((article) => article.id));
    });
  }
  async function deleteArticle(articleId: string) {
    const response = await fetch(`/api/admin/articles/${encodeURIComponent(articleId)}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    const result = await readJsonResponse<DeleteResponse>(response);
    if (!response.ok) {
      throw new Error(
        result.message ?? `Article delete nahi hua. HTTP ${response.status}`,
      );
    }
    return result;
  }
  async function deleteSingleArticle(article: ArticleListItem) {
    if (isDeleting) {
      return;
    }
    const confirmed = window.confirm(
      `"${article.title}" permanently delete karna hai? Ye action undo nahi hoga.`,
    );
    if (!confirmed) {
      return;
    }
    setMessage("");
    setError("");
    setDeletingIds(new Set([article.id]));
    try {
      const result = await deleteArticle(article.id);
      setArticles((current) =>
        current.filter((currentArticle) => currentArticle.id !== article.id),
      );
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(article.id);
        return next;
      });
      setMessage(result.message ?? "Article permanently delete ho gaya.");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Article delete nahi hua.",
      );
    } finally {
      setDeletingIds(new Set());
    }
  }
  async function deleteSelectedArticles() {
    if (selectedArticles.length === 0 || isDeleting) {
      return;
    }
    const confirmed = window.confirm(
      `${selectedArticles.length} selected article(s) permanently delete karne hain? Ye action undo nahi hoga.`,
    );
    if (!confirmed) {
      return;
    }
    setMessage("");
    setError("");
    const idsToDelete = selectedArticles.map((article) => article.id);
    setDeletingIds(new Set(idsToDelete));
    const deletedIds = new Set<string>();
    const failures: string[] = [];
    try {
      for (const article of selectedArticles) {
        try {
          await deleteArticle(article.id);
          deletedIds.add(article.id);
        } catch (deleteError) {
          failures.push(
            `${article.title}: ${
              deleteError instanceof Error ? deleteError.message : "Delete failed"
            }`,
          );
        }
      }
      if (deletedIds.size > 0) {
        setArticles((current) =>
          current.filter((article) => !deletedIds.has(article.id)),
        );
        setSelectedIds((current) => {
          const next = new Set(current);
          for (const id of deletedIds) {
            next.delete(id);
          }
          return next;
        });
        router.refresh();
      }
      if (failures.length > 0) {
        setError(
          `${deletedIds.size} article(s) delete hue. ${failures.length} failed: ${failures.join(
            " | ",
          )}`,
        );
      } else {
        setMessage(`${deletedIds.size} article(s) permanently delete ho gaye.`);
      }
    } finally {
      setDeletingIds(new Set());
    }
  }
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create, edit, republish and delete website articles.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-foreground text-background inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      </div>
      {message ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}
      {articles.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={toggleAll}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {allSelected ? (
              <CheckSquare className="h-5 w-5 text-blue-700" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            {allSelected ? "Unselect all" : "Select all"}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500">{selectedCount} selected</span>
            <button
              type="button"
              onClick={() => void deleteSelectedArticles()}
              disabled={selectedCount === 0 || isDeleting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Selected
            </button>
          </div>
        </div>
      ) : null}
      {articles.length === 0 ? (
        <div className="border-border bg-background rounded-xl border p-8 text-center shadow-sm">
          <FileText className="text-muted-foreground mx-auto h-10 w-10" />
          <p className="text-muted-foreground mt-3 text-sm">No articles are available.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => {
            const selected = selectedIds.has(article.id);
            const deleting = deletingIds.has(article.id);
            return (
              <article
                key={article.id}
                className={`border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6 ${
                  selected ? "ring-2 ring-blue-500/30" : ""
                }`}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 gap-4">
                    <button
                      type="button"
                      onClick={() => toggleSelected(article.id)}
                      disabled={isDeleting}
                      aria-label={
                        selected ? `Unselect ${article.title}` : `Select ${article.title}`
                      }
                      className="mt-1 shrink-0 disabled:opacity-50"
                    >
                      {selected ? (
                        <CheckSquare className="h-5 w-5 text-blue-700" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium capitalize">
                          {article.status}
                        </span>
                        {article.categoryName ? (
                          <span className="border-border rounded-full border px-2.5 py-1 text-xs">
                            {article.categoryName}
                          </span>
                        ) : null}
                        {article.isFeatured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                            <Star className="h-3 w-3" />
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 truncate text-lg font-semibold">
                        {article.title}
                      </h2>
                      {article.excerpt ? (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                          {article.excerpt}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Updated {new Date(article.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="border-border hover:bg-muted inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void deleteSingleArticle(article)}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
