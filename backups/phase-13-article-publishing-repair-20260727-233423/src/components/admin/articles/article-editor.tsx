"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  LoaderCircle,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
type ArticleEditorProps = {
  mode: "create" | "edit";
  articleId?: string;
};
type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  focusKeyword: string | null;
  categoryName: string | null;
};
type ApiResponse = {
  article?: ArticleRecord & {
    id: string;
    slug: string;
    status: string;
  };
  message?: string;
};
const categoryOptions = [
  "Finance",
  "Science",
  "Technology",
  "AI",
  "Health",
  "Education",
  "Business",
  "History",
  "Environment",
  "Space",
  "Psychology",
  "General Knowledge",
];
function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
export function ArticleEditor({ mode, articleId }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (mode !== "edit" || !articleId) {
      return;
    }
    async function loadArticle() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, {
          cache: "no-store",
        });
        const responseData = (await response.json()) as ApiResponse;
        if (!response.ok || !responseData.article) {
          throw new Error(responseData.message || "Unable to load the article.");
        }
        const article = responseData.article;
        setTitle(article.title);
        setSlug(article.slug);
        setExcerpt(article.excerpt ?? "");
        setContent(article.content);
        setCategory(article.categoryName ?? "");
        setStatus(article.status);
        setFeatured(article.isFeatured);
        setSeoTitle(article.seoTitle ?? "");
        setSeoDescription(article.seoDescription ?? "");
        setFocusKeyword(article.focusKeyword ?? "");
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load the article.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    void loadArticle();
  }, [articleId, mode]);
  const wordCount = useMemo(() => {
    const cleanContent = content.trim();
    if (!cleanContent) {
      return 0;
    }
    return cleanContent.split(/\s+/).length;
  }, [content]);
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));
  function handleTitleChange(value: string) {
    setTitle(value);
    if (mode === "create") {
      setSlug(createSlug(value));
    }
  }
  async function saveArticle(nextStatus: "draft" | "published") {
    setMessage("");
    setError("");
    if (!title.trim()) {
      setError("Article title is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Article URL slug is required.");
      return;
    }
    if (!content.trim()) {
      setError("Article content is required.");
      return;
    }
    if (!category) {
      setError("Article category is required.");
      return;
    }
    setIsSaving(true);
    try {
      const endpoint =
        mode === "edit" && articleId
          ? `/api/admin/articles/${articleId}`
          : "/api/admin/articles";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          category,
          status: nextStatus,
          featured,
          seoTitle,
          seoDescription,
          focusKeyword,
          tags,
        }),
      });
      const responseData = (await response.json()) as ApiResponse;
      if (!response.ok || !responseData.article) {
        throw new Error(responseData.message || "Unable to save the article.");
      }
      setStatus(responseData.article.status);
      setMessage(
        responseData.message ||
          (nextStatus === "published"
            ? "Article published successfully."
            : "Draft saved successfully."),
      );
      if (mode === "create") {
        router.replace(`/admin/articles/${responseData.article.id}/edit`);
      }
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save the article.",
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
      setError("Enter an article title before opening preview.");
      return;
    }
    window.open(`/article/${slug}`, "_blank", "noopener,noreferrer");
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
            href="/admin/articles"
            aria-label="Back to articles"
            className="border-border hover:bg-muted mt-1 rounded-lg border p-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {mode === "create" ? "New Article" : "Edit Article"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Write, optimize and publish website content.
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
            onClick={() => void saveArticle("draft")}
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
            onClick={() => void saveArticle("published")}
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
                <label
                  htmlFor="article-title"
                  className="mb-2 block text-sm font-semibold"
                >
                  Article Title
                </label>
                <input
                  id="article-title"
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Enter article title"
                  required
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-3 text-lg font-semibold outline-none focus:ring-4"
                />
              </div>
              <div>
                <label
                  htmlFor="article-slug"
                  className="mb-2 block text-sm font-semibold"
                >
                  URL Slug
                </label>
                <input
                  id="article-slug"
                  value={slug}
                  onChange={(event) => setSlug(createSlug(event.target.value))}
                  placeholder="article-url-slug"
                  required
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-4"
                />
              </div>
              <div>
                <label
                  htmlFor="article-excerpt"
                  className="mb-2 block text-sm font-semibold"
                >
                  Excerpt
                </label>
                <textarea
                  id="article-excerpt"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="Write a concise article summary"
                  rows={3}
                  maxLength={500}
                  className="border-border bg-background focus:ring-foreground/20 w-full resize-y rounded-lg border px-4 py-3 text-sm outline-none focus:ring-4"
                />
                <p className="text-muted-foreground mt-2 text-right text-xs">
                  {excerpt.length}/500
                </p>
              </div>
            </div>
          </section>
          <section className="border-border bg-background rounded-xl border shadow-sm">
            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div>
                <h2 className="font-semibold">Article Content</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {wordCount} words · {readingTime} minute read
                </p>
              </div>
              <button
                type="button"
                className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </button>
            </div>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Start writing the article content..."
              required
              rows={22}
              className="bg-background min-h-[520px] w-full resize-y rounded-b-xl p-5 text-sm leading-7 outline-none sm:p-6"
            />
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="seo-title" className="mb-2 block text-sm font-medium">
                  SEO Title
                </label>
                <input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  maxLength={60}
                  placeholder="Search result title"
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-4"
                />
                <p className="text-muted-foreground mt-2 text-right text-xs">
                  {seoTitle.length}/60
                </p>
              </div>
              <div>
                <label
                  htmlFor="seo-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Meta Description
                </label>
                <textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Search result description"
                  className="border-border bg-background focus:ring-foreground/20 w-full resize-y rounded-lg border px-4 py-3 text-sm outline-none focus:ring-4"
                />
                <p className="text-muted-foreground mt-2 text-right text-xs">
                  {seoDescription.length}/160
                </p>
              </div>
              <div>
                <label htmlFor="focus-keyword" className="mb-2 block text-sm font-medium">
                  Focus Keyword
                </label>
                <input
                  id="focus-keyword"
                  value={focusKeyword}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                  placeholder="Primary target keyword"
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-4"
                />
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Publishing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="article-status"
                  className="mb-2 block text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id="article-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4"
                >
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                  className="h-4 w-4 rounded"
                />
                Feature on homepage
              </label>
            </div>
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Category</h2>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              className="border-border bg-background focus:ring-foreground/20 mt-4 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4"
            >
              <option value="">Select category</option>
              {categoryOptions.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Featured Image</h2>
            <button
              type="button"
              className="border-border text-muted-foreground hover:bg-muted mt-4 flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center transition-colors"
            >
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">Select from Media Library</span>
              <span className="text-xs">Recommended size: 1200 × 630 pixels</span>
            </button>
          </section>
          <section className="border-border bg-background rounded-xl border p-5 shadow-sm">
            <h2 className="font-semibold">Tags</h2>
            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Add tags separated by commas"
              className="border-border bg-background focus:ring-foreground/20 mt-4 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4"
            />
          </section>
        </aside>
      </div>
    </form>
  );
}
