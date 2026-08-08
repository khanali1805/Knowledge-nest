import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { articleEditLocks, articles } from "@/db/schema";
const LOCK_DURATION_MS = 90 * 1000;
export type ArticleEditLock = {
  articleId: string;
  ownerUsername: string;
  lockToken: string;
  acquiredAt: Date;
  heartbeatAt: Date;
  expiresAt: Date;
};
function createExpiryDate(): Date {
  return new Date(Date.now() + LOCK_DURATION_MS);
}
export async function getArticleEditLock(
  articleId: string,
): Promise<ArticleEditLock | null> {
  const now = new Date();
  await db
    .delete(articleEditLocks)
    .where(
      and(eq(articleEditLocks.articleId, articleId), lt(articleEditLocks.expiresAt, now)),
    );
  const [lock] = await db
    .select()
    .from(articleEditLocks)
    .where(eq(articleEditLocks.articleId, articleId))
    .limit(1);
  return lock ?? null;
}
export async function acquireArticleEditLock({
  articleId,
  ownerUsername,
}: {
  articleId: string;
  ownerUsername: string;
}): Promise<{
  acquired: boolean;
  lock: ArticleEditLock;
}> {
  const [article] = await db
    .select({
      id: articles.id,
    })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);
  if (!article) {
    throw new Error("Article lock ke liye article nahi mila.");
  }
  const existingLock = await getArticleEditLock(articleId);
  if (existingLock) {
    return {
      acquired: existingLock.ownerUsername === ownerUsername,
      lock: existingLock,
    };
  }
  const [createdLock] = await db
    .insert(articleEditLocks)
    .values({
      articleId,
      ownerUsername,
      expiresAt: createExpiryDate(),
    })
    .onConflictDoNothing()
    .returning();
  if (createdLock) {
    return {
      acquired: true,
      lock: createdLock,
    };
  }
  const competingLock = await getArticleEditLock(articleId);
  if (!competingLock) {
    throw new Error("Article edit lock create nahi hua.");
  }
  return {
    acquired: competingLock.ownerUsername === ownerUsername,
    lock: competingLock,
  };
}
export async function heartbeatArticleEditLock({
  articleId,
  ownerUsername,
  lockToken,
}: {
  articleId: string;
  ownerUsername: string;
  lockToken: string;
}): Promise<ArticleEditLock | null> {
  const now = new Date();
  const [updatedLock] = await db
    .update(articleEditLocks)
    .set({
      heartbeatAt: now,
      expiresAt: createExpiryDate(),
    })
    .where(
      and(
        eq(articleEditLocks.articleId, articleId),
        eq(articleEditLocks.ownerUsername, ownerUsername),
        eq(articleEditLocks.lockToken, lockToken),
      ),
    )
    .returning();
  return updatedLock ?? null;
}
export async function releaseArticleEditLock({
  articleId,
  ownerUsername,
  lockToken,
}: {
  articleId: string;
  ownerUsername: string;
  lockToken: string;
}): Promise<boolean> {
  const deletedLocks = await db
    .delete(articleEditLocks)
    .where(
      and(
        eq(articleEditLocks.articleId, articleId),
        eq(articleEditLocks.ownerUsername, ownerUsername),
        eq(articleEditLocks.lockToken, lockToken),
      ),
    )
    .returning({
      articleId: articleEditLocks.articleId,
    });
  return deletedLocks.length > 0;
}
