"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  LoaderCircle,
  Search,
  X,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/lib/http/read-api-response";
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
  categoryId: string | null;
  categoryName: string | null;
  featuredImageId?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
};
type ApiResponse = {
  article?: ArticleRecord & {
    id: string;
    slug: string;
    status: string;
  };
  message?: string;
};
type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};
type CategoriesApiResponse = {
  categories?: CategoryOption[];
  message?: string;
};
type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
};
type ArticleAiApiResponse = {
  article?: GeneratedArticle;
  message?: string;
};
type MediaFile = {
  id: string;
  name: string;
  originalName?: string;
  fileName?: string;
  url: string;
  size: number;
  type: string;
  altText?: string | null;
  createdAt: string;
};
type MediaApiResponse = {
  files?: MediaFile[];
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
export function ArticleEditor({ mode, articleId }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [tags, setTags] = useState("");
  const [featuredImageId, setFeaturedImageId] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        });
        const responseData = await readApiResponse<CategoriesApiResponse>(response);
        if (!response.ok) {
          throw new Error(responseData.message || "Unable to load categories.");
        }
        if (isMounted) {
          setCategoryOptions(responseData.categories ?? []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load categories.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    }
    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);
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
        const responseData = await readApiResponse<ApiResponse>(response);
        if (!response.ok || !responseData.article) {
          throw new Error(responseData.message || "Unable to load the article.");
        }
        const article = responseData.article;
        setTitle(article.title);
        setSlug(article.slug);
        setExcerpt(article.excerpt ?? "");
        setContent(article.content);
        setCategoryId(article.categoryId ?? "");
        setStatus(article.status);
        setFeatured(article.isFeatured);
        setSeoTitle(article.seoTitle ?? "");
        setSeoDescription(article.seoDescription ?? "");
        setFocusKeyword(article.focusKeyword ?? "");
        setFeaturedImageId(article.featuredImageId ?? "");
        setFeaturedImageUrl(article.featuredImageUrl ?? "");
        setFeaturedImageAlt(article.featuredImageAlt ?? "");
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
    if (!categoryId) {
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
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          categoryId,
          status: nextStatus,
          isFeatured: featured,
          readingTimeMinutes: readingTime,
          seoTitle,
          seoDescription,
          focusKeyword,
          featuredImageId,
          tags,
        }),
      });
      const responseData = await readApiResponse<ApiResponse>(response);
      if (!response.ok || !responseData.article) {
        throw new Error(responseData.message || "Unable to save the article.");
      }
      setStatus(responseData.article.status);
      setFeatured(responseData.article.isFeatured);
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
      if (nextStatus === "published") {
        window.setTimeout(() => {
          router.refresh();
        }, 250);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save the article.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  async function generateWithAi() {
    const instruction = window.prompt(
      "Describe the article you want the AI Assistant to create or improve:",
      title.trim() ? `Write a complete, useful article about "${title.trim()}".` : "",
    );
    if (instruction === null) {
      return;
    }
    if (instruction.trim().length < 10) {
      setError("AI instruction must contain at least 10 characters.");
      return;
    }
    setMessage("");
    setError("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/articles/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: instruction,
          title,
          existingContent: content,
          focusKeyword,
        }),
      });
      const responseData = await readApiResponse<ArticleAiApiResponse>(response);
      if (!response.ok || !responseData.article) {
        throw new Error(responseData.message || "Unable to generate article content.");
      }
      const generatedArticle = responseData.article;
      setTitle(generatedArticle.title);
      setSlug(createSlug(generatedArticle.title));
      setExcerpt(generatedArticle.excerpt);
      setContent(generatedArticle.content);
      setSeoTitle(generatedArticle.seoTitle);
      setSeoDescription(generatedArticle.seoDescription);
      setFocusKeyword(generatedArticle.focusKeyword);
      setMessage(responseData.message || "AI article content generated successfully.");
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate article content.",
      );
    } finally {
      setIsGenerating(false);
    }
  }
  async function openMediaPicker() {
    setIsMediaPickerOpen(true);
    setIsLoadingMedia(true);
    setError("");
    try {
      const response = await fetch("/api/admin/media", {
        cache: "no-store",
      });
      const responseData = await readApiResponse<MediaApiResponse>(response);
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to load media files.");
      }
      setMediaFiles(responseData.files ?? []);
    } catch (mediaError) {
      setError(
        mediaError instanceof Error ? mediaError.message : "Unable to load media files.",
      );
    } finally {
      setIsLoadingMedia(false);
    }
  }
  function selectFeaturedImage(file: MediaFile) {
    setFeaturedImageId(file.id);
    setFeaturedImageUrl(file.url);
    setFeaturedImageAlt(file.altText || file.name);
    setIsMediaPickerOpen(false);
    setMediaSearch("");
  }
  function removeFeaturedImage() {
    setFeaturedImageId("");
    setFeaturedImageUrl("");
    setFeaturedImageAlt("");
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
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
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
            className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="space-y-6 sm:space-y-8">
          <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
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
                  {wordCount} words Â· {readingTime} minute read
                </p>
              </div>
              <button
                type="button"
                onClick={() => void generateWithAi()}
                disabled={isGenerating || isSaving}
                className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "AI Assistant"}
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
          <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
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
        <aside className="space-y-6 sm:space-y-8">
          <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
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
          <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Category</h2>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              disabled={isLoadingCategories || categoryOptions.length === 0}
              className="border-border bg-background focus:ring-foreground/20 mt-4 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isLoadingCategories
                  ? "Loading categories..."
                  : categoryOptions.length === 0
                    ? "No categories available"
                    : "Select category"}
              </option>
              {categoryOptions.map((categoryOption) => (
                <option key={categoryOption.id} value={categoryOption.id}>
                  {categoryOption.name}
                </option>
              ))}
            </select>
          </section>
          <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Featured Image</h2>
              {featuredImageId ? (
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              ) : null}
            </div>
            {featuredImageUrl ? (
              <button
                type="button"
                onClick={() => void openMediaPicker()}
                className="border-border bg-muted relative mt-4 block aspect-[1200/630] w-full overflow-hidden rounded-lg border"
              >
                <Image
                  src={featuredImageUrl}
                  alt={featuredImageAlt || "Featured image"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void openMediaPicker()}
                className="border-border text-muted-foreground hover:bg-muted mt-4 flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center transition-colors"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm font-medium">Select from Media Library</span>
                <span className="text-xs">Recommended size: 1200 × 630 pixels</span>
              </button>
            )}
            {featuredImageUrl ? (
              <button
                type="button"
                onClick={() => void openMediaPicker()}
                className="border-border hover:bg-muted mt-3 w-full rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              >
                Change Featured Image
              </button>
            ) : null}
          </section>
          <section className="border-border bg-background rounded-2xl border p-5 shadow-sm sm:p-6">
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
      {isMediaPickerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select featured image"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="bg-background flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl shadow-2xl">
            <div className="border-border flex items-center justify-between gap-4 border-b p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold">Media Library</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Select an image for this article.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMediaPickerOpen(false);
                  setMediaSearch("");
                }}
                aria-label="Close media library"
                className="border-border hover:bg-muted rounded-lg border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-border border-b p-4 sm:p-5">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  type="search"
                  value={mediaSearch}
                  onChange={(event) => setMediaSearch(event.target.value)}
                  placeholder="Search media files"
                  className="border-border bg-background focus:ring-foreground/20 w-full rounded-lg border py-2.5 pr-3 pl-10 text-sm outline-none focus:ring-4"
                />
              </div>
            </div>
            <div className="min-h-72 flex-1 overflow-y-auto p-4 sm:p-5">
              {isLoadingMedia ? (
                <div className="flex min-h-72 items-center justify-center">
                  <LoaderCircle className="text-muted-foreground h-7 w-7 animate-spin" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-muted-foreground flex min-h-72 flex-col items-center justify-center text-center">
                  <ImageIcon className="h-10 w-10" />
                  <p className="mt-3 text-sm">No media files have been uploaded.</p>
                  <Link
                    href="/admin/media"
                    className="border-border hover:bg-muted mt-4 rounded-lg border px-4 py-2 text-sm font-medium"
                  >
                    Open Media Library
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mediaFiles
                    .filter((file) =>
                      file.name.toLowerCase().includes(mediaSearch.trim().toLowerCase()),
                    )
                    .map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => selectFeaturedImage(file)}
                        className={`border-border overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-md ${
                          featuredImageId === file.id ? "ring-foreground ring-2" : ""
                        }`}
                      >
                        <div className="bg-muted relative aspect-video">
                          <Image
                            src={file.url}
                            alt={file.altText || file.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
