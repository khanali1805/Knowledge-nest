import { and, desc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { articleRevisions, articles, type ArticleRevisionSnapshot } from "@/db/schema";
export type RevisionReason = "autosave" | "manual" | "publish" | "recovery";
export type StoredArticleRevision = {
  id: string;
  articleId: string;
  revisionNumber: number;
  title: string;
  content: string;
  snapshot: ArticleRevisionSnapshot;
  reason: string;
  changeSummary: string | null;
  createdAt: Date;
};
function normaliseSnapshot(snapshot: ArticleRevisionSnapshot): ArticleRevisionSnapshot {
  return {
    title: snapshot.title.trim(),
    slug: snapshot.slug.trim(),
    excerpt: snapshot.excerpt ?? "",
    content: snapshot.content || "<p></p>",
    categoryId: snapshot.categoryId ?? "",
    status: snapshot.status || "draft",
    isFeatured: Boolean(snapshot.isFeatured),
    seoTitle: snapshot.seoTitle ?? "",
    seoDescription: snapshot.seoDescription ?? "",
    focusKeyword: snapshot.focusKeyword ?? "",
    tags: snapshot.tags ?? "",
    featuredImageId: snapshot.featuredImageId ?? "",
    readingTimeMinutes: Math.max(
      1,
      Number.isFinite(snapshot.readingTimeMinutes)
        ? Math.round(snapshot.readingTimeMinutes)
        : 1,
    ),
  };
}
async function getNextRevisionNumber(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  articleId: string,
): Promise<number> {
  const [revisionResult] = await transaction
    .select({
      maximum: max(articleRevisions.revisionNumber),
    })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, articleId));
  return Number(revisionResult?.maximum ?? 0) + 1;
}
export async function findArticleForRevision(articleId: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);
  return article ?? null;
}
export async function listArticleRevisions(
  articleId: string,
  limit = 30,
): Promise<StoredArticleRevision[]> {
  const rows = await db
    .select({
      id: articleRevisions.id,
      articleId: articleRevisions.articleId,
      revisionNumber: articleRevisions.revisionNumber,
      title: articleRevisions.title,
      content: articleRevisions.content,
      snapshot: articleRevisions.snapshot,
      reason: articleRevisions.reason,
      changeSummary: articleRevisions.changeSummary,
      createdAt: articleRevisions.createdAt,
    })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, articleId))
    .orderBy(desc(articleRevisions.revisionNumber))
    .limit(Math.min(100, Math.max(1, limit)));
  return rows.map((row) => ({
    ...row,
    snapshot: row.snapshot ?? {
      title: row.title,
      slug: "",
      excerpt: "",
      content: row.content,
      categoryId: "",
      status: "draft",
      isFeatured: false,
      seoTitle: "",
      seoDescription: "",
      focusKeyword: "",
      tags: "",
      featuredImageId: "",
      readingTimeMinutes: 1,
    },
  }));
}
export async function createArticleRevision({
  articleId,
  snapshot,
  reason,
  changeSummary,
}: {
  articleId: string;
  snapshot: ArticleRevisionSnapshot;
  reason: RevisionReason;
  changeSummary?: string;
}): Promise<StoredArticleRevision> {
  const article = await findArticleForRevision(articleId);
  if (!article) {
    throw new Error("Article revision ke liye article nahi mila.");
  }
  const normalisedSnapshot = normaliseSnapshot(snapshot);
  return db.transaction(async (transaction) => {
    const revisionNumber = await getNextRevisionNumber(transaction, articleId);
    const [createdRevision] = await transaction
      .insert(articleRevisions)
      .values({
        articleId,
        revisionNumber,
        title: normalisedSnapshot.title || article.title,
        content: normalisedSnapshot.content,
        snapshot: normalisedSnapshot,
        reason,
        changeSummary: changeSummary?.trim() || null,
      })
      .returning({
        id: articleRevisions.id,
        articleId: articleRevisions.articleId,
        revisionNumber: articleRevisions.revisionNumber,
        title: articleRevisions.title,
        content: articleRevisions.content,
        snapshot: articleRevisions.snapshot,
        reason: articleRevisions.reason,
        changeSummary: articleRevisions.changeSummary,
        createdAt: articleRevisions.createdAt,
      });
    if (!createdRevision) {
      throw new Error("Server revision create nahi hui.");
    }
    const oldRevisions = await transaction
      .select({
        id: articleRevisions.id,
      })
      .from(articleRevisions)
      .where(eq(articleRevisions.articleId, articleId))
      .orderBy(desc(articleRevisions.revisionNumber))
      .offset(50);
    if (oldRevisions.length > 0) {
      for (const oldRevision of oldRevisions) {
        await transaction
          .delete(articleRevisions)
          .where(eq(articleRevisions.id, oldRevision.id));
      }
    }
    return {
      ...createdRevision,
      snapshot: createdRevision.snapshot ?? normalisedSnapshot,
    };
  });
}
export async function deleteArticleRevision({
  articleId,
  revisionId,
}: {
  articleId: string;
  revisionId: string;
}): Promise<boolean> {
  const deletedRows = await db
    .delete(articleRevisions)
    .where(
      and(eq(articleRevisions.id, revisionId), eq(articleRevisions.articleId, articleId)),
    )
    .returning({
      id: articleRevisions.id,
    });
  return deletedRows.length > 0;
}
export async function restoreArticleRevision({
  articleId,
  revisionId,
}: {
  articleId: string;
  revisionId: string;
}) {
  return db.transaction(async (transaction) => {
    const [currentArticle] = await transaction
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);
    if (!currentArticle) {
      throw new Error("Article recovery ke liye article nahi mila.");
    }
    const [selectedRevision] = await transaction
      .select()
      .from(articleRevisions)
      .where(
        and(
          eq(articleRevisions.id, revisionId),
          eq(articleRevisions.articleId, articleId),
        ),
      )
      .limit(1);
    if (!selectedRevision) {
      throw new Error("Selected server revision nahi mili.");
    }
    const selectedSnapshot = selectedRevision.snapshot;
    if (!selectedSnapshot) {
      throw new Error("Selected revision mein complete snapshot available nahi hai.");
    }
    const recoverySnapshot: ArticleRevisionSnapshot = {
      title: currentArticle.title,
      slug: currentArticle.slug,
      excerpt: currentArticle.excerpt ?? "",
      content: currentArticle.content,
      categoryId: currentArticle.categoryId ?? "",
      status: currentArticle.status,
      isFeatured: currentArticle.isFeatured,
      seoTitle: currentArticle.seoTitle ?? "",
      seoDescription: currentArticle.seoDescription ?? "",
      focusKeyword: currentArticle.focusKeyword ?? "",
      tags: "",
      featuredImageId: currentArticle.featuredImageId ?? "",
      readingTimeMinutes: currentArticle.readingTimeMinutes,
    };
    const recoveryRevisionNumber = await getNextRevisionNumber(transaction, articleId);
    await transaction.insert(articleRevisions).values({
      articleId,
      revisionNumber: recoveryRevisionNumber,
      title: recoverySnapshot.title,
      content: recoverySnapshot.content,
      snapshot: recoverySnapshot,
      reason: "recovery",
      changeSummary: "Automatic backup before revision restore.",
    });
    const restoredStatus =
      selectedSnapshot.status === "published" ? "draft" : selectedSnapshot.status;
    const [updatedArticle] = await transaction
      .update(articles)
      .set({
        title: selectedSnapshot.title,
        slug: selectedSnapshot.slug || currentArticle.slug,
        excerpt: selectedSnapshot.excerpt || null,
        content: selectedSnapshot.content,
        categoryId: selectedSnapshot.categoryId || null,
        featuredImageId: selectedSnapshot.featuredImageId || null,
        status: restoredStatus,
        seoTitle: selectedSnapshot.seoTitle || null,
        seoDescription: selectedSnapshot.seoDescription || null,
        focusKeyword: selectedSnapshot.focusKeyword || null,
        readingTimeMinutes: selectedSnapshot.readingTimeMinutes,
        isFeatured: selectedSnapshot.isFeatured,
        publishedAt: restoredStatus === "published" ? currentArticle.publishedAt : null,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, articleId))
      .returning();
    if (!updatedArticle) {
      throw new Error("Article revision restore nahi hui.");
    }
    return {
      article: updatedArticle,
      snapshot: {
        ...selectedSnapshot,
        status: restoredStatus,
      },
    };
  });
}
