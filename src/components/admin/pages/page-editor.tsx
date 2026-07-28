"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, LoaderCircle, Save, Send } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/lib/http/read-api-response";
type PageEditorProps = {
  mode: "create" | "edit";
  pageId?: string;
};
type PageRecord = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
};
type PageApiResponse = {
  page?: PageRecord;
  message?: string;
};
function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
export function PageEditor({ mode, pageId }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (mode !== "edit" || !pageId) {
      return;
    }
    async function loadPage() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/pages/${pageId}`, {
          cache: "no-store",
        });
        const responseData = await readApiResponse<PageApiResponse>(response);
        if (!response.ok || !responseData.page) {
          throw new Error(responseData.message || "Unable to load the page.");
        }
        setTitle(responseData.page.title);
        setSlug(responseData.page.slug);
        setContent(responseData.page.content);
        setStatus(responseData.page.status);
        setSeoTitle(responseData.page.seoTitle ?? "");
        setSeoDescription(responseData.page.seoDescription ?? "");
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load the page.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    void loadPage();
  }, [mode, pageId]);
  const wordCount = useMemo(() => {
    const cleanContent = content.trim();
    if (!cleanContent) {
      return 0;
    }
    return cleanContent.split(/\s+/).length;
  }, [content]);
  function handleTitleChange(value: string) {
    setTitle(value);
    if (mode === "create") {
      setSlug(createSlug(value));
    }
  }
  async function savePage(nextStatus: "draft" | "published") {
    setMessage("");
    setError("");
    if (!title.trim()) {
      setError("Page title is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Page URL slug is required.");
      return;
    }
    if (!content.trim()) {
      setError("Page content is required.");
      return;
    }
    setIsSaving(true);
    try {
      const endpoint =
        mode === "edit" && pageId ? `/api/admin/pages/${pageId}` : "/api/admin/pages";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          status: nextStatus,
          seoTitle,
          seoDescription,
        }),
      });
      const responseData = await readApiResponse<PageApiResponse>(response);
      if (!response.ok || !responseData.page) {
        throw new Error(responseData.message || "Unable to save the page.");
      }
      setStatus(responseData.page.status);
      setMessage(
        responseData.message ||
          (nextStatus === "published"
            ? "Page published successfully."
            : "Draft saved successfully."),
      );
      if (mode === "create") {
        router.replace(`/admin/pages/${responseData.page.id}/edit`);
      }
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save the page.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }
  function openPreview() {
    if (!slug.trim()) {
      setError("Enter a page title before opening preview.");
      return;
    }
    window.open(`/page/${slug}`, "_blank", "noopener,noreferrer");
  }
  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/pages"
            aria-label="Back to pages"
            className="border-border hover:bg-muted mt-1 rounded-lg border p-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {mode === "create" ? "New Page" : "Edit Page"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Create and manage a website information page.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openPreview}
            disabled={isSaving}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => void savePage("draft")}
            disabled={isSaving}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => void savePage("published")}
            disabled={isSaving}
            className="bg-foreground text-background inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish
          </button>
        </div>
      </div>
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm sm:p-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="page-title" className="mb-2 block text-sm font-semibold">
                  Page Title
                </label>
                <input
                  id="page-title"
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Enter page title"
                  required
                  disabled={isSaving}
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-3 text-lg font-semibold outline-none focus:ring-4 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="page-slug" className="mb-2 block text-sm font-semibold">
                  URL Slug
                </label>
                <input
                  id="page-slug"
                  value={slug}
                  onChange={(event) => setSlug(createSlug(event.target.value))}
                  placeholder="page-url-slug"
                  required
                  disabled={isSaving}
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-4 disabled:opacity-50"
                />
              </div>
            </div>
          </section>
          <section className="border-border bg-background rounded-xl border shadow-sm">
            <div className="border-border border-b p-4">
              <h2 className="font-semibold">Page Content</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </p>
            </div>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write the page content..."
              required
              rows={22}
              disabled={isSaving}
              className="bg-background min-h-[520px] w-full resize-y rounded-b-xl p-5 text-sm leading-7 outline-none disabled:opacity-50 sm:p-6"
            />
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="page-seo-title"
                  className="mb-2 block text-sm font-medium"
                >
                  SEO Title
                </label>
                <input
                  id="page-seo-title"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  maxLength={60}
                  placeholder="Search result title"
                  disabled={isSaving}
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-4 disabled:opacity-50"
                />
                <p className="text-muted-foreground mt-2 text-right text-xs">
                  {seoTitle.length}/60
                </p>
              </div>
              <div>
                <label
                  htmlFor="page-seo-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Meta Description
                </label>
                <textarea
                  id="page-seo-description"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Search result description"
                  disabled={isSaving}
                  className="border-border bg-background focus:ring-foreground/20 w-full resize-y rounded-lg border px-4 py-3 text-sm outline-none focus:ring-4 disabled:opacity-50"
                />
                <p className="text-muted-foreground mt-2 text-right text-xs">
                  {seoDescription.length}/160
                </p>
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Publishing</h2>
            <div className="mt-4">
              <label htmlFor="page-status" className="mb-2 block text-sm font-medium">
                Status
              </label>
              <select
                id="page-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isSaving}
                className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Page URL</h2>
            <p className="text-muted-foreground mt-3 text-sm break-all">
              /page/{slug || "page-url-slug"}
            </p>
          </section>
        </aside>
      </div>
    </form>
  );
}
