import { resolveMasterCategory, type MasterCategorySlug } from "@/lib/categories";
export type ArticleStatus = "draft" | "published";
export type ArticleSaveAction = "save-draft" | "publish" | "update";
export type ArticleEditorData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  featuredImage: string;
  featured: boolean;
  status: ArticleStatus;
  tags: string[];
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  author: string;
  publishDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
export type ArticleValidationErrors = Partial<Record<keyof ArticleEditorData, string>>;
export const EMPTY_ARTICLE_DATA: ArticleEditorData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  categorySlug: "",
  featuredImage: "",
  featured: false,
  status: "draft",
  tags: [],
  focusKeyword: "",
  metaTitle: "",
  metaDescription: "",
  author: "",
  publishDate: null,
  createdAt: null,
  updatedAt: null,
};
export function createArticleSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
export function normaliseArticleData(
  input: Partial<ArticleEditorData>,
): ArticleEditorData {
  const resolvedCategory = resolveMasterCategory(input.categorySlug);
  return {
    ...EMPTY_ARTICLE_DATA,
    ...input,
    title: input.title?.trim() ?? "",
    slug: createArticleSlug(input.slug?.trim() || input.title?.trim() || ""),
    excerpt: input.excerpt?.trim() ?? "",
    content: input.content ?? "",
    categorySlug: resolvedCategory?.slug ?? "",
    featuredImage: input.featuredImage?.trim() ?? "",
    featured: input.featured === true,
    status: input.status === "published" ? "published" : "draft",
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => tag.trim()).filter(Boolean)
      : [],
    focusKeyword: input.focusKeyword?.trim() ?? "",
    metaTitle: input.metaTitle?.trim() ?? "",
    metaDescription: input.metaDescription?.trim() ?? "",
    author: input.author?.trim() ?? "",
    publishDate: input.publishDate ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
}
export function validateArticleData(
  input: Partial<ArticleEditorData>,
  action: ArticleSaveAction,
): ArticleValidationErrors {
  const article = normaliseArticleData(input);
  const errors: ArticleValidationErrors = {};
  if (!article.title) {
    errors.title = "Article title is required.";
  }
  if (!article.slug) {
    errors.slug = "Article slug is required.";
  }
  if (!article.categorySlug) {
    errors.categorySlug = "Article category is required.";
  }
  if (article.categorySlug && !resolveMasterCategory(article.categorySlug)) {
    errors.categorySlug = "Select a valid article category.";
  }
  if (action === "publish" && !article.content.trim()) {
    errors.content = "Article content is required before publishing.";
  }
  return errors;
}
export function hasArticleErrors(errors: ArticleValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}
export function applyArticleSaveAction(
  input: Partial<ArticleEditorData>,
  action: ArticleSaveAction,
  existingStatus?: ArticleStatus,
): ArticleEditorData {
  const now = new Date().toISOString();
  const article = normaliseArticleData(input);
  let status: ArticleStatus = article.status;
  if (action === "save-draft") {
    status = "draft";
  }
  if (action === "publish") {
    status = "published";
  }
  if (action === "update" && existingStatus) {
    status = existingStatus;
  }
  return {
    ...article,
    status,
    publishDate: status === "published" ? (article.publishDate ?? now) : null,
    createdAt: article.createdAt ?? now,
    updatedAt: now,
  };
}
export function resolveArticleCategorySlug(value: string): MasterCategorySlug | null {
  return resolveMasterCategory(value)?.slug ?? null;
}
