"use client";
import { ArrowLeft, Eye, LoaderCircle, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  ArticleStep3Tools,
  type ArticleStep3Snapshot,
} from "@/components/admin/article-step-3-tools";
import { ArticleStep4ServerTools } from "@/components/admin/article-step-4-server-tools";
import { ArticleStep5CollaborationTools } from "@/components/admin/article-step-5-collaboration-tools";
import { ArticleStep6ActivityTools } from "@/components/admin/article-step-6-activity-tools";
import { ArticleStep7Dashboard } from "@/components/admin/article-step-7-dashboard";
type ArticleEditorFormProps = {
  mode: "new" | "edit";
  initialArticle?: {
    id?: string;
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    categoryId?: string | null;
    categorySlug?: string;
    status?: string;
    isFeatured?: boolean;
    featured?: boolean;
    seoTitle?: string | null;
    metaTitle?: string;
    seoDescription?: string | null;
    metaDescription?: string;
    focusKeyword?: string | null;
    featuredImageId?: string | null;
    tags?: string[] | string;
    updatedAt?: string | Date | null;
  };
};
type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};
type CategoriesResponse = {
  categories?: CategoryOption[];
  message?: string;
};
type SaveResponse = {
  article?: {
    id: string;
    slug: string;
    status: string;
    updatedAt?: string | Date | null;
  };
  message?: string;
  errors?: unknown;
  conflict?: boolean;
  serverUpdatedAt?: string;
};
type SelectedAiDraft = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  metaTitle?: string;
  seoTitle?: string;
  metaDescription?: string;
  seoDescription?: string;
  focusKeyword?: string;
  tags?: string[];
  categorySlug?: string;
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
function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
export function ArticleEditorForm({ mode, initialArticle }: ArticleEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [slug, setSlug] = useState(initialArticle?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt ?? "");
  const [content, setContent] = useState(initialArticle?.content ?? "<p></p>");
  const [categoryId, setCategoryId] = useState(initialArticle?.categoryId ?? "");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [status, setStatus] = useState(initialArticle?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(
    initialArticle?.isFeatured ?? initialArticle?.featured ?? false,
  );
  const [seoTitle, setSeoTitle] = useState(
    initialArticle?.seoTitle ?? initialArticle?.metaTitle ?? "",
  );
  const [seoDescription, setSeoDescription] = useState(
    initialArticle?.seoDescription ?? initialArticle?.metaDescription ?? "",
  );
  const [focusKeyword, setFocusKeyword] = useState(initialArticle?.focusKeyword ?? "");
  const [tags, setTags] = useState(
    Array.isArray(initialArticle?.tags)
      ? initialArticle.tags.join(", ")
      : (initialArticle?.tags ?? ""),
  );
  const [featuredImageId, setFeaturedImageId] = useState(
    initialArticle?.featuredImageId ?? "",
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string>(() => {
    const value = initialArticle?.updatedAt;
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      return value;
    }
    return "";
  });
  const [isLockedByAnotherUser, setIsLockedByAnotherUser] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const wordCount = useMemo(() => {
    const text = stripHtml(content);
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [content]);
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));
  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        });
        const data = (await response.json()) as CategoriesResponse;
        if (!response.ok) {
          throw new Error(data.message ?? "Categories load nahi huin.");
        }
        if (!active) {
          return;
        }
        const availableCategories = data.categories ?? [];
        setCategories(availableCategories);
        if (!categoryId) {
          const matchedCategory = availableCategories.find(
            (category) => category.slug === initialArticle?.categorySlug,
          );
          if (matchedCategory) {
            setCategoryId(matchedCategory.id);
          }
        }
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(
          loadError instanceof Error ? loadError.message : "Categories load nahi huin.",
        );
      } finally {
        if (active) {
          setIsLoadingCategories(false);
        }
      }
    }
    void loadCategories();
    return () => {
      active = false;
    };
  }, [categoryId, initialArticle?.categorySlug]);
  useEffect(() => {
    function receiveAiDraft(event: Event) {
      const customEvent = event as CustomEvent<SelectedAiDraft>;
      const article = customEvent.detail;
      if (!article) {
        return;
      }
      const nextTitle = article.title?.trim() ?? "";
      if (nextTitle) {
        setTitle(nextTitle);
        setSlug(article.slug?.trim() || createSlug(nextTitle));
      }
      if (article.excerpt !== undefined) {
        setExcerpt(article.excerpt);
      }
      if (article.content !== undefined) {
        setContent(article.content);
      }
      setSeoTitle(article.metaTitle ?? article.seoTitle ?? nextTitle);
      setSeoDescription(
        article.metaDescription ?? article.seoDescription ?? article.excerpt ?? "",
      );
      setFocusKeyword(article.focusKeyword ?? "");
      if (Array.isArray(article.tags)) {
        setTags(article.tags.join(", "));
      }
      if (article.categorySlug) {
        const matchingCategory = categories.find(
          (category) => category.slug === article.categorySlug,
        );
        if (matchingCategory) {
          setCategoryId(matchingCategory.id);
        }
      }
      setMessage("AI draft editor mein load ho gaya hai. Review karke publish karein.");
      setError("");
      document.getElementById("article-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    window.addEventListener("knowledge-nest:ai-draft-selected", receiveAiDraft);
    return () => {
      window.removeEventListener("knowledge-nest:ai-draft-selected", receiveAiDraft);
    };
  }, [categories]);
  function handleTitleChange(value: string) {
    setTitle(value);
    if (mode === "new") {
      setSlug(createSlug(value));
    }
  }
  async function saveArticle(nextStatus: "draft" | "published") {
    setMessage("");
    setError("");
    if (!title.trim()) {
      setError("Article title required hai.");
      return;
    }
    if (!slug.trim()) {
      setError("Article slug required hai.");
      return;
    }
    if (!categoryId) {
      setError("Article category required hai.");
      return;
    }
    if (nextStatus === "published" && !stripHtml(content)) {
      setError("Publish karne se pehle article content required hai.");
      return;
    }
    setIsSaving(true);
    try {
      const endpoint =
        mode === "edit" && initialArticle?.id
          ? `/api/admin/articles/${initialArticle.id}`
          : "/api/admin/articles";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: createSlug(slug),
          excerpt: excerpt.trim(),
          content,
          categoryId,
          status: nextStatus,
          isFeatured,
          readingTimeMinutes: readingTime,
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          focusKeyword: focusKeyword.trim(),
          featuredImageId: featuredImageId || null,
          tags,
          expectedUpdatedAt: mode === "edit" ? serverUpdatedAt || undefined : undefined,
        }),
      });
      const data = await readJsonResponse<SaveResponse>(response);
      if (!response.ok || !data.article) {
        throw new Error(data.message ?? "Article save nahi hua.");
      }
      setStatus(data.article.status);
      if (data.article.updatedAt) {
        const updatedValue = data.article.updatedAt;
        setServerUpdatedAt(
          updatedValue instanceof Date
            ? updatedValue.toISOString()
            : String(updatedValue),
        );
      }
      setMessage(
        data.message ??
          (nextStatus === "published"
            ? "Article publish ho gaya."
            : "Draft save ho gaya."),
      );
      if (mode === "new") {
        router.replace(`/admin/articles/${data.article.id}/edit`);
      }
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Article save nahi hua.");
    } finally {
      setIsSaving(false);
    }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }
  function openPreview() {
    if (!slug.trim()) {
      setError("Preview se pehle title aur slug enter karein.");
      return;
    }
    window.open(`/article/${createSlug(slug)}`, "_blank", "noopener,noreferrer");
  }
  const step3StorageKey = useMemo(
    () =>
      ["knowledge-nest", "article-revisions", mode, initialArticle?.id ?? "new"].join(
        ":",
      ),
    [initialArticle?.id, mode],
  );
  const step3Snapshot = useMemo<ArticleStep3Snapshot>(
    () => ({
      title,
      slug,
      excerpt,
      content,
      categoryId,
      status,
      isFeatured,
      seoTitle,
      seoDescription,
      focusKeyword,
      tags,
      featuredImageId,
    }),
    [
      categoryId,
      content,
      excerpt,
      featuredImageId,
      focusKeyword,
      isFeatured,
      seoDescription,
      seoTitle,
      slug,
      status,
      tags,
      title,
    ],
  );
  function restoreStep3Revision(revision: ArticleStep3Snapshot) {
    setTitle(revision.title);
    setSlug(revision.slug);
    setExcerpt(revision.excerpt);
    setContent(revision.content);
    setCategoryId(revision.categoryId);
    setStatus(revision.status);
    setIsFeatured(revision.isFeatured);
    setSeoTitle(revision.seoTitle);
    setSeoDescription(revision.seoDescription);
    setFocusKeyword(revision.focusKeyword);
    setTags(revision.tags);
    setFeaturedImageId(revision.featuredImageId);
    setMessage("Selected local revision editor mein restore ho gayi.");
    setError("");
  }
  function insertUploadedImage(imageUrl: string, altText: string, mediaId?: string) {
    const safeUrl = imageUrl
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const safeAltText = altText
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    setContent((currentContent) => {
      const baseContent = currentContent.trim() === "<p></p>" ? "" : currentContent;
      return [baseContent, `<p><img src="${safeUrl}" alt="${safeAltText}" /></p>`].join(
        "",
      );
    });
    if (mediaId) {
      setFeaturedImageId(mediaId);
    }
    setMessage("Uploaded image article editor mein add ho gayi.");
    setError("");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ArticleStep3Tools
        storageKey={step3StorageKey}
        snapshot={step3Snapshot}
        onRestore={restoreStep3Revision}
        onInsertImage={insertUploadedImage}
        onFeaturedImageChange={setFeaturedImageId}
      />
      <ArticleStep4ServerTools
        articleId={initialArticle?.id}
        snapshot={step3Snapshot}
        readingTimeMinutes={readingTime}
        onRestore={restoreStep3Revision}
      />{" "}
      <ArticleStep5CollaborationTools
        articleId={initialArticle?.id}
        onLockChange={setIsLockedByAnotherUser}
      />{" "}
      <ArticleStep6ActivityTools
        articleId={initialArticle?.id}
        snapshot={step3Snapshot}
      />{" "}
      <ArticleStep7Dashboard articleId={initialArticle?.id} />
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/articles"
            aria-label="Back to articles"
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {mode === "new" ? "Create Article" : "Edit Article"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              AI draft ya manual content ko edit karke publish karein.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openPreview}
            disabled={isSaving || isLockedByAnotherUser}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => void saveArticle("draft")}
            disabled={isSaving || isLockedByAnotherUser}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
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
            disabled={isSaving || isLockedByAnotherUser}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {mode === "edit" && status === "published" ? "Republish" : "Publish"}
          </button>
        </div>
      </div>
      {message ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="article-title"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Article Title
                </label>
                <input
                  id="article-title"
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="Article title enter karein"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xl font-bold outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label
                  htmlFor="article-slug"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  URL Slug
                </label>
                <input
                  id="article-slug"
                  value={slug}
                  onChange={(event) => setSlug(createSlug(event.target.value))}
                  placeholder="article-url-slug"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label
                  htmlFor="article-excerpt"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Excerpt
                </label>
                <textarea
                  id="article-excerpt"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Article ka short summary"
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
                <p className="mt-2 text-right text-xs text-slate-500">
                  {excerpt.length}/500
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">Article Content</h3>
                <p className="text-xs text-slate-500">
                  {wordCount} words · {readingTime} minute read
                </p>
              </div>
            </div>
            <RichTextEditor value={content} onChange={setContent} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-black text-slate-950">
              Search Engine Optimization
            </h3>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="seo-title" className="mb-2 block text-sm font-bold">
                  SEO Title
                </label>
                <input
                  id="seo-title"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label htmlFor="seo-description" className="mb-2 block text-sm font-bold">
                  SEO Description
                </label>
                <textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label htmlFor="focus-keyword" className="mb-2 block text-sm font-bold">
                  Focus Keyword
                </label>
                <input
                  id="focus-keyword"
                  value={focusKeyword}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label htmlFor="article-tags" className="mb-2 block text-sm font-bold">
                  Tags
                </label>
                <input
                  id="article-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="AI, Technology, Guides"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-black text-slate-950">Publishing</h3>
            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="article-category"
                  className="mb-2 block text-sm font-bold"
                >
                  Category
                </label>
                <select
                  id="article-category"
                  value={categoryId}
                  disabled={isLoadingCategories}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    {isLoadingCategories ? "Loading..." : "Select category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold">Featured article</span>
              </label>
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-bold text-slate-800">Current Status</p>
                <p className="mt-1 text-slate-600 capitalize">{status}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
