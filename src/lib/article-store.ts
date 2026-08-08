import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ArticleEditorData, ArticleStatus } from "@/lib/article-publishing-workflow";
const ARTICLE_STORE_PATH = path.join(process.cwd(), "data", "articles.json");
type ArticleStoreShape = {
  articles: ArticleEditorData[];
};
async function ensureArticleStoreDirectory() {
  await fs.mkdir(path.dirname(ARTICLE_STORE_PATH), {
    recursive: true,
  });
}
export async function readArticleStore(): Promise<ArticleEditorData[]> {
  try {
    const content = await fs.readFile(ARTICLE_STORE_PATH, "utf8");
    const parsed = JSON.parse(content) as ArticleStoreShape | ArticleEditorData[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.articles)) {
      return parsed.articles;
    }
    return [];
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
export async function writeArticleStore(
  articles: readonly ArticleEditorData[],
): Promise<void> {
  await ensureArticleStoreDirectory();
  const store: ArticleStoreShape = {
    articles: [...articles],
  };
  await fs.writeFile(ARTICLE_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}
export async function findArticleById(id: string): Promise<ArticleEditorData | null> {
  const articles = await readArticleStore();
  return articles.find((article) => article.id === id) ?? null;
}
export async function findArticleBySlug(slug: string): Promise<ArticleEditorData | null> {
  const articles = await readArticleStore();
  return articles.find((article) => article.slug === slug) ?? null;
}
export async function getExistingArticleStatus(
  id: string,
): Promise<ArticleStatus | undefined> {
  const article = await findArticleById(id);
  return article?.status;
}
export async function saveArticleToStore(
  article: ArticleEditorData,
): Promise<ArticleEditorData> {
  const articles = await readArticleStore();
  const nextArticle = {
    ...article,
    id: article.id || crypto.randomUUID(),
  };
  const existingIndex = articles.findIndex((item) => item.id === nextArticle.id);
  if (existingIndex >= 0) {
    articles[existingIndex] = nextArticle;
  } else {
    articles.push(nextArticle);
  }
  await writeArticleStore(articles);
  return nextArticle;
}
