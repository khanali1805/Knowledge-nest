import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
type ArticlePublishingPaths = {
  articleSlug?: string | null;
  categorySlug?: string | null;
};
function normalizePathSegment(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalizedValue = value.trim().replace(/^\/+|\/+$/g, "");
  return normalizedValue || null;
}
export function revalidateArticlePublishingPaths(
  paths: ArticlePublishingPaths = {},
): void {
  const articleSlug = normalizePathSegment(paths.articleSlug);
  const categorySlug = normalizePathSegment(paths.categorySlug);
  const staticPaths = [
    "/",
    "/latest",
    "/featured",
    "/search",
    "/sitemap-page",
    "/sitemap.xml",
    "/rss.xml",
    "/feed",
  ];
  for (const path of staticPaths) {
    revalidatePath(path);
  }
  revalidatePath("/article/[slug]", "page");
  revalidatePath("/category/[slug]", "page");
  if (articleSlug) {
    revalidatePath(`/article/${articleSlug}`);
  }
  if (categorySlug) {
    revalidatePath(`/category/${categorySlug}`);
  }
  revalidateTag("articles", "max");
  revalidateTag("published-articles", "max");
  revalidateTag("categories", "max");
  revalidateTag("blogging-overview", "max");
}
